// Rate limit map (in-memory for serverless instance lifetime)
const ipRateLimit = new Map();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        const body = req.body || {};

        // 1. Honeypot check (anti-spam)
        if (body.company_title || body.honeypot) {
            console.warn('Spam submission detected by honeypot');
            return res.status(200).json({ ok: true, orderId: 'PNR-' + Math.floor(100000 + Math.random() * 900000) });
        }

        // 2. Simple Rate Limiting by IP (max 6 orders per 5 minutes)
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
        const now = Date.now();
        const windowMs = 5 * 60 * 1000;

        if (clientIp !== 'unknown') {
            const ipData = ipRateLimit.get(clientIp) || [];
            const recentRequests = ipData.filter(timestamp => now - timestamp < windowMs);

            if (recentRequests.length >= 6) {
                return res.status(429).json({
                    ok: false,
                    error: 'لقد تم إرسال عدة طلبات مؤخراً. يرجى الانتظار قليلاً أو مراسلتنا واتساب مباشرة.'
                });
            }

            recentRequests.push(now);
            ipRateLimit.set(clientIp, recentRequests);
        }

        // 3. Validation
        const {
            name,
            phone,
            phone2 = '',
            gov,
            address,
            notes = '',
            product = 'Pioneer Medical Scrub',
            color = 'Onyx Black',
            size = 'L',
            quantity = 1,
            finalTotal,
            isFreeShipping = false
        } = body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ ok: false, error: 'الاسم بالكامل مطلوب' });
        }

        const cleanPhone = String(phone || '').replace(/\D/g, '');
        const egPhoneRegex = /^01[0125][0-9]{8}$/;
        if (!egPhoneRegex.test(cleanPhone)) {
            return res.status(400).json({ ok: false, error: 'رقم الموبايل يجب أن يكون رقماً مصرياً صحيحاً (11 رقم)' });
        }

        if (!gov || !address || address.trim().length < 3) {
            return res.status(400).json({ ok: false, error: 'المحافظة والعنوان بالتفصيل مطلوبان' });
        }

        // 4. Generate Order ID
        const orderId = `PNR-${Date.now().toString().slice(-6)}`;
        const fullPhone = phone2 ? `${cleanPhone} / ${phone2}` : cleanPhone;
        const shippingText = isFreeShipping ? 'شحن مجاني 🎁' : '+ مصاريف الشحن';
        const productDetailsText = `طقم سكراب: ${color} | المقاس: ${size} | الكمية: ${quantity} | الإجمالي: ${finalTotal} ج.م`;

        // 5. Write to Google Sheet
        const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";
        try {
            await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    name: `د. ${name}`,
                    phone: fullPhone,
                    city: gov,
                    address: address + (notes ? ` (ملاحظات: ${notes})` : ''),
                    productDetails: productDetailsText
                })
            });
        } catch (sheetErr) {
            console.error('Google Sheet log error:', sheetErr);
            // Non-blocking: continue to Telegram notification
        }

        // 6. Telegram Alert
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const customerWaMsg = `أهلاً دكتور ${name}، مع حضرتك فريق Pioneer للملابس الطبية 🩺\nبخصوص طلبك رقم #${orderId} لسكراب (${color}) مقاس (${size}). بنأكد مع حضرتك موعد التسليم والشحن.`;
            const customerWaUrl = `https://wa.me/20${cleanPhone}?text=${encodeURIComponent(customerWaMsg)}`;

            const tgMessage = `🎉 *أوردر جديد مؤكد من الموقع (PIONEER)*\n\n` +
                              `🆔 *رقم الطلب:* #${orderId}\n` +
                              `👤 *الاسم:* د. ${name}\n` +
                              `📱 *الموبايل:* \`${cleanPhone}\`${phone2 ? ` (بديل: \`${phone2}\`)` : ''}\n` +
                              `📍 *المحافظة:* ${gov}\n` +
                              `🏠 *العنوان:* ${address}\n` +
                              `👕 *السكراب:* ${color} | مقاس: *${size}* | كمية: ${quantity}\n` +
                              `💰 *المبلغ المطلوب عند الاستلام:* *${finalTotal} ج.م* (${shippingText})\n` +
                              (notes ? `📝 *ملاحظات:* ${notes}\n` : '') +
                              `\n🛡️ *السياسة:* معاينة مع المندوب + استبدال 3 أيام`;

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: tgMessage,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '👉 اضغط لمراسلة العميل بالطلب واتساب', url: customerWaUrl }]
                        ]
                    }
                })
            }).catch(tgErr => console.error('Telegram alert error:', tgErr));
        }

        return res.status(200).json({ ok: true, orderId });
    } catch (err) {
        console.error('Order handler error:', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
}
