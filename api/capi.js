import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN;
        const PIXEL_ID = '1835661177259760';

        if (!META_CAPI_TOKEN) {
            // Gracefully acknowledge without throwing if token is not yet configured in Vercel
            return res.status(200).json({ ok: true, note: 'META_CAPI_TOKEN not configured' });
        }

        const { eventName, eventId, params = {}, eventSourceUrl, phone } = req.body || {};

        if (!eventName || !eventId) {
            return res.status(400).json({ error: 'Missing eventName or eventId' });
        }

        // Parse Cookies (_fbp, _fbc)
        const cookieHeader = req.headers.cookie || '';
        const cookies = {};
        cookieHeader.split(';').forEach(c => {
            const [k, v] = c.trim().split('=');
            if (k && v) cookies[k] = decodeURIComponent(v);
        });

        const fbp = cookies['_fbp'] || null;
        const fbc = cookies['_fbc'] || null;

        // Client IP & User Agent
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || null);
        const clientUserAgent = req.headers['user-agent'] || null;

        // Hash phone number using SHA-256 according to Meta specs
        const userData = {
            client_user_agent: clientUserAgent,
            client_ip_address: clientIp
        };

        if (fbp) userData.fbp = fbp;
        if (fbc) userData.fbc = fbc;

        if (phone) {
            let cleanPhone = String(phone).replace(/\D/g, '');
            if (cleanPhone.startsWith('01')) {
                cleanPhone = '2' + cleanPhone; // Egypt country code
            }
            if (cleanPhone.length >= 11) {
                const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');
                userData.ph = [hashedPhone];
            }
        }

        const eventTime = Math.floor(Date.now() / 1000);

        const eventPayload = {
            event_name: eventName,
            event_time: eventTime,
            event_id: eventId,
            event_source_url: eventSourceUrl || 'https://pioneer-wear.vercel.app',
            action_source: 'website',
            user_data: userData,
            custom_data: {
                content_ids: params.content_ids || undefined,
                content_name: params.content_name || undefined,
                content_type: 'product',
                currency: params.currency || 'EGP',
                value: typeof params.value === 'number' ? params.value : undefined,
                num_items: params.num_items || undefined
            }
        };

        const capiUrl = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`;

        const fbResponse = await fetch(capiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [eventPayload] })
        });

        const fbResult = await fbResponse.json();
        return res.status(200).json({ ok: true, result: fbResult });
    } catch (error) {
        console.error('CAPI Server Error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
}
