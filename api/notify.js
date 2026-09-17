export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { type, phone, details, weight, height, resultSize } = req.body;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing API Keys in Vercel" });
    }

    try {
        let aiMessage = "????? ?? ?????? ?? ????? ???? ???????.. ?????? ??????? ?????????? ???? ?????? ?????";
        
        // 1. Call Gemini AI to generate a custom message
        if (type === "size_guide") {
            const prompt = `أنت موظف مبيعات. عميل استخدم دليل المقاسات الآن، وزنه ${weight} وطوله ${height} والمقاس ${resultSize}. 
            اكتب رسالة واتساب عفوية بالعامية من سطر واحد فقط (أقل من 20 كلمة) ترحب به وتخبره أن المقاس مناسب وتطلب تأكيد اللون. لا تضف أي زيادات.`;
            
            const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + GEMINI_API_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const geminiData = await geminiRes.json();
            if (geminiData.candidates && geminiData.candidates[0].content.parts[0].text) {
                aiMessage = geminiData.candidates[0].content.parts[0].text.trim();
            }
        } else if (type === "exit_intent") {
            const prompt = `عميل أخذ كود الخصم DOCTOR5 ولم يشتري. 
            اكتب رسالة واتساب من سطر واحد (أقل من 20 كلمة) بالعامية، تذكره بالكود وتسأله لو محتاج مساعدة.`;
            
            const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + GEMINI_API_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const geminiData = await geminiRes.json();
            if (geminiData.candidates && geminiData.candidates[0].content.parts[0].text) {
                aiMessage = geminiData.candidates[0].content.parts[0].text.trim();
            }
        }

        // Limit message length to avoid URL explosion (Arabic chars take 9 bytes when url-encoded)
        if (aiMessage.length > 200) {
            aiMessage = aiMessage.substring(0, 200) + "...";
        }

        // 2. Prepare WhatsApp Link
        let cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("01")) cleanPhone = "2" + cleanPhone;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aiMessage)}`;

        // 3. Send to Telegram
        const tgText = `🚨 عميل جديد (${type === "size_guide" ? "استشارة مقاس" : "طلب خصم"})\n` +
                       `📱 الرقم: ${phone}\n` +
                       `ℹ️ التفاصيل: ${details}\n\n` +
                       `🤖 رسالة Gemini المقترحة:\n${aiMessage}`;

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
