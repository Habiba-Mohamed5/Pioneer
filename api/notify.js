// Helper to escape Markdown special characters for Telegram
function sanitizeMarkdown(text = '') {
    return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return res.status(500).json({ ok: false, error: "Missing configuration" });
        }

        const body = req.body || {};

        // Sanitize and cap field lengths
        const type = String(body.type || 'lead').slice(0, 32);
        const rawPhone = String(body.phone || '').trim().slice(0, 25);
        const cleanPhone = rawPhone.replace(/\D/g, '');

        if (cleanPhone.length < 10) {
            return res.status(400).json({ ok: false, error: "Invalid phone number" });
        }

        const name = String(body.name || '').trim().slice(0, 80);
        const details = String(body.details || '').trim().slice(0, 300);
        const color = String(body.color || '').trim().slice(0, 50);
        const resultSize = String(body.resultSize || '').trim().slice(0, 10);
        const finalTotal = typeof body.finalTotal === 'number' ? body.finalTotal : null;

        const governorate = String(body.governorate || '').trim().slice(0, 50);
        const quantity = typeof body.quantity === 'number' ? body.quantity : 1;

        let aiMessage = "";
        let tgTitle = "";
        let priorityTag = "";

        if (type === "checkout_abandon" || type === "abandoned_checkout" || type === "abandoned_lead") {
            priorityTag = "🚨 [HOT LEAD]";
            tgTitle = `${priorityTag} سلة متروكة في صفحة الشراء`;
            aiMessage = `أهلاً يا دكتور ${name ? name : ""}، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` + 
                        `لاحظنا اهتمام حضرتك بسكراب Pioneer لون (${color || "المعروض"}) مقاس (${resultSize || "المقترح"}).\n` + 
                        `حابين نتأكد لو في أي استفسار بخصوص المقاس أو معاينة واستلام السكراب نقدر نساعد حضرتك فيه؟\n` +
                        `(للإلغاء أرسل قف)`;
        } 
        else if (type === "size_guide") {
            priorityTag = "✨ [WARM LEAD]";
            tgTitle = `${priorityTag} استشارة مقاس وحاسبة القياس`;
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` + 
                        `بناءً على حساب قياسك في الموقع، مقاسك المقترح هو (${resultSize || "-"}) في سكراب Pioneer (${color || ""}).\n` + 
                        `يسعدنا حجز وتجهيز طلبك مع إمكانية المعاينة مع المندوب قبل الدفع.\n` +
                        `(للإلغاء أرسل قف)`;
        }
        else if (type === "exit_offer") {
            priorityTag = "✨ [WARM LEAD]";
            tgTitle = `${priorityTag} تفعيل كود الشحن المجاني (PIONEER-VIP)`;
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` + 
                        `بخصوص كود الشحن المجاني السريع (PIONEER-VIP) الخاص بحضرتك على أول طلب سكراب.\n` + 
                        `الكود مفعل ومربوط برقمك وصالح لمدة 48 ساعة، تحب نساعدك في حجز مقاسك ولونك المفضل؟\n` +
                        `(للإلغاء أرسل قف)`;
        }
        else if (type === "new_order") {
            priorityTag = "🎉 [ORDER]";
            tgTitle = `${priorityTag} أوردر جديد مؤكد`;
            const shippingCost = typeof body.shipping === 'number' ? body.shipping : 0;
            const subtotal = typeof body.subtotal === 'number' ? body.subtotal : (finalTotal ? finalTotal - shippingCost : null);
            const breakdown = shippingCost === 0 ? "شحن مجاني 🎁" : `${subtotal} ج.م سكراب + ${shippingCost} ج.م مصاريف شحن`;
            aiMessage = `أهلاً يا دكتور ${name || ""}، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `بنتواصل مع حضرتك لتأكيد أوردر السكراب لون (${color || ""}) مقاس (${resultSize || ""}).\n` + 
                        (finalTotal ? `المطلوب عند الاستلام: ${finalTotal} ج.م (${breakdown}).\n` : '') +
                        `التأكيد والتوصيل مع حضرتك خلال 24 ساعة مع إمكانية المعاينة قبل الدفع.\n` +
                        `(للإلغاء أرسل قف)`;
        } else {
            priorityTag = "💬 [LEAD]";
            tgTitle = `${priorityTag} استفسار من الموقع`;
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺 يسعدنا مساعدتك في أي استفسار بخصوص المقاسات أو الألوان.\n(للإلغاء أرسل قف)`;
        }

        // WhatsApp direct customer link
        let waPhone = cleanPhone;
        if (waPhone.startsWith("01")) waPhone = "2" + waPhone;
        const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(aiMessage)}`;

        // Telegram message
        const tgText = `🚨 *${sanitizeMarkdown(tgTitle)}*\n` +
                       `📱 الرقم: \`${sanitizeMarkdown(rawPhone)}\`\n` +
                       (name ? `👤 الاسم: ${sanitizeMarkdown(name)}\n` : '') +
                       (governorate ? `📍 المحافظة: ${sanitizeMarkdown(governorate)}\n` : '') +
                       `ℹ️ التفاصيل: ${sanitizeMarkdown(details)}\n\n` +
                       `💬 *الرسالة المجهزة للعميل (ضغطة واحدة للإرسال):*\n${sanitizeMarkdown(aiMessage)}`;

        // Concurrent dispatches: Telegram + Google Sheet logging
        const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";
        const sheetPromise = fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                phone: cleanPhone,
                name: name || 'طبيب مهتم',
                source: type,
                color: color || '-',
                size: resultSize || '-',
                quantity: quantity,
                governorate: governorate || '-',
                status: 'new',
                followed_up_at: '',
                notes: details,
                productDetails: `سكراب: ${color || '-'} | المقاس: ${resultSize || '-'}`
            }),
            signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined
        }).catch(err => console.warn('GAS lead log error:', err.message));

        const tgPromise = fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: tgText,
                parse_mode: "MarkdownV2",
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [[{ text: "👉 اضغط لمراسلته واتساب فوراً", url: waLink }]]
                }
            }),
            signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined
        }).catch(err => console.warn('TG notify error:', err.message));

        await Promise.allSettled([sheetPromise, tgPromise]);
        
        // Return only { ok: true } - do not echo raw Telegram response or errors
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Notify error:", error.message);
        return res.status(500).json({ ok: false, error: "Internal processing error" });
    }
}
