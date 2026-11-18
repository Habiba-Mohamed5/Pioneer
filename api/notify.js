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

        let aiMessage = "";
        let tgTitle = "";

        if (type === "size_guide") {
            tgTitle = "استشارة مقاس";
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `لاحظنا استخدامك لدليل المقاسات بالموقع.. بناءً على وزنك وطولك، مقاسك المقترح هو (${resultSize}) وده متوفر عندنا وتقدر تلبسه مرتاح جداً.\n` + 
                        `تحب نأكد لحضرتك أوردر بأي لون؟`;
        } 
        else if (type === "abandoned_checkout" || type === "abandoned_lead") {
            tgTitle = "⚠️ عميل لم يكمل الطلب (Abandoned Lead)";
            aiMessage = `أهلاً يا دكتور ${name || ""}، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `لاحظنا اهتمام حضرتك بسكراب Pioneer لون (${color || "المعروض"}) مقاس (${resultSize || ""}).\n` + 
                        `حابين نتأكد لو في أي استفسار بخصوص المقاس أو معاينة واستلام السكراب نقدر نساعد حضرتك فيه؟`;
        }
        else if (type === "new_order") {
            tgTitle = "🎉 أوردر جديد (شراء)";
            const shippingText = finalTotal && finalTotal >= 1800 ? "شحن مجاني 🎁" : "+ مصاريف الشحن 🚚";
            aiMessage = `أهلاً يا دكتور ${name || ""}، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `بنتواصل مع حضرتك لتأكيد أوردر السكراب لون (${color || ""}) مقاس (${resultSize || ""}).\n` + 
                        (finalTotal ? `الإجمالي ${finalTotal} جنيه (${shippingText}).\n` : '') +
                        `نأكد الأوردر ويتشحن لحضرتك؟`;
        } else {
            tgTitle = "استفسار من الموقع";
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺 يسعدنا مساعدتك في أي استفسار بخصوص المقاسات أو الألوان.`;
        }

        // WhatsApp direct customer link
        let waPhone = cleanPhone;
        if (waPhone.startsWith("01")) waPhone = "2" + waPhone;
        const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(aiMessage)}`;

        // Telegram message
        const tgText = `🚨 *${sanitizeMarkdown(tgTitle)}*\n` +
                       `📱 الرقم: \`${sanitizeMarkdown(rawPhone)}\`\n` +
                       (name ? `👤 الاسم: ${sanitizeMarkdown(name)}\n` : '') +
                       `ℹ️ التفاصيل: ${sanitizeMarkdown(details)}\n\n` +
                       `💬 *الرسالة المجهزة للعميل:*\n${sanitizeMarkdown(aiMessage)}`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: tgText,
                parse_mode: "MarkdownV2",
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [[{ text: "👉 اضغط لمراسلته واتساب", url: waLink }]]
                }
            })
        });
        
        // Return only { ok: true } - do not echo raw Telegram response or errors
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Notify error:", error.message);
        return res.status(500).json({ ok: false, error: "Internal processing error" });
    }
}
