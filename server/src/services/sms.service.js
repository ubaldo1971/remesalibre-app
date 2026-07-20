import twilio from 'twilio';

/**
 * SMS/WhatsApp Service using Twilio
 * 
 * Sends OTP codes via WhatsApp (Sandbox) or SMS for phone verification.
 * Uses lazy initialization to ensure dotenv has loaded first.
 */
class SmsService {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    /**
     * Lazy initialize Twilio client (allows dotenv to load first)
     */
    _init() {
        if (this.initialized) return;
        this.initialized = true;

        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        this.useWhatsApp = process.env.TWILIO_USE_WHATSAPP === 'true';

        console.log('[SMS] Initializing Twilio...');
        console.log('[SMS] Account SID:', this.accountSid ? 'SET' : 'NOT SET');
        console.log('[SMS] Use WhatsApp:', this.useWhatsApp);

        if (this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
            console.log('[SMS] Twilio client initialized successfully');
            console.log(`[SMS] Mode: ${this.useWhatsApp ? 'WhatsApp' : 'SMS'}`);
        } else {
            console.log('[SMS] Twilio credentials not found - running in dev mode');
        }
    }

    /**
     * Send OTP code via WhatsApp or SMS
     */
    async sendOTP(phoneNumber, code) {
        // Lazy init on first use
        this._init();

        const message = `🌟 *¡Bienvenido a Remesa Libre!* 🌟

🔐 Tu código de verificación es: *${code}*

⏱️ Expira en 5 minutos.
⚠️ No compartas este código con nadie.`;

        console.log(`[OTP] Code for ${phoneNumber}: ${code}`);

        if (!this.client) {
            console.log('[OTP] Dev mode - code logged above');
            return {
                success: true,
                mode: 'development',
                message: 'OTP logged to console (Twilio not configured)'
            };
        }

        try {
            let result;

            if (this.useWhatsApp) {
                console.log(`[WhatsApp] Sending to ${phoneNumber}...`);
                result = await this.client.messages.create({
                    body: message,
                    from: this.whatsappNumber,
                    to: `whatsapp:${phoneNumber}`
                });
                console.log(`[WhatsApp] Message sent. SID: ${result.sid}`);
            } else if (this.fromNumber) {
                result = await this.client.messages.create({
                    body: message,
                    from: this.fromNumber,
                    to: phoneNumber
                });
                console.log(`[SMS] Message sent. SID: ${result.sid}`);
            } else {
                return {
                    success: true,
                    mode: 'development',
                    message: 'No sender configured'
                };
            }

            return {
                success: true,
                mode: this.useWhatsApp ? 'whatsapp' : 'sms',
                messageSid: result.sid,
                status: result.status
            };
        } catch (error) {
            console.error('[OTP] Error sending:', error.message);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    isConfigured() {
        this._init();
        return this.client !== null && (this.useWhatsApp || this.fromNumber);
    }

    getMode() {
        this._init();
        if (!this.client) return 'development';
        if (this.useWhatsApp) return 'whatsapp';
        if (this.fromNumber) return 'sms';
        return 'development';
    }
}

export const smsService = new SmsService();
