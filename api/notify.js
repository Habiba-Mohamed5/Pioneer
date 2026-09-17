export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: "Missing API Keys" });
        }

        const { type, phone, details, weight, height, resultSize, name, color, finalTotal } = req.body;

        let aiMessage = "";
        let tgTitle = "";

        // 1. Templates based on scenario
        if (type === "size_guide") {
            tgTitle = "استشارة مقاس";
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `لاحظنا استخدامك لدليل المقاسات بالموقع.. بناءً على وزنك وطولك، مقاسك المثالي هو (${resultSize}) وده متوفر عندنا وتقدر تلبسه مرتاح جداً.\n` + 
                        `تحب نأكد لحضرتك أوردر بأي لون؟`;
        } 
        else if (type === "exit_intent") {
            tgTitle = "طلب كود الخصم (ولم يشتري)";
            aiMessage = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `لاحظنا إنك طلبت كود الخصم (DOCTOR5).. حابين نأكدلك إن الكود شغال ومفعل لحضرتك لمدة 24 ساعة فقط ⏳\n` +
                        `لو واجهتك أي مشكلة في الموقع أو محتاج مساعدة في اختيار المقاس إحنا معاك وتحت أمرك.`;
        }
        else if (type === "new_order") {
            tgTitle = "🎉 أوردر جديد (شراء)";
            aiMessage = `أهلاً يا دكتور ${name || ""}، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️\n` + 
                        `بنتواصل مع حضرتك لتأكيد أوردر السكراب لون (${color}) مقاس (${resultSize}).\n` + 
                        `الإجمالي ${finalTotal} جنيه شامل الشحن.\n` +
                        `نأكد الأوردر ويتشحن لحضرتك؟`;
        }

        // 2. Prepare WhatsApp Link
        let cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("01")) cleanPhone = "2" + cleanPhone;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aiMessage)}`;

        // 3. Send to Telegram
        const tgText = `🚨 ${tgTitle}\n` +
                       `📱 الرقم: ${phone}\n` +
                       `ℹ️ التفاصيل: ${details}\n\n` +
                       `💬 *الرسالة المجهزة للعميل:*\n${aiMessage}`;

        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: tgText,
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [[{ text: "👉 اضغطي لمراسلته واتساب", url: waLink }]]
                }
            })
        });
        
        const tgData = await tgRes.json();
        res.status(200).json({ success: true, telegram: tgData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
