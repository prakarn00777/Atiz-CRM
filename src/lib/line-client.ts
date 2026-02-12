import { createHmac } from 'crypto';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

function getChannelSecret(): string {
    const secret = process.env.LINE_CHANNEL_SECRET;
    if (!secret) throw new Error('LINE_CHANNEL_SECRET is not configured');
    return secret;
}

function getChannelAccessToken(): string {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
    return token;
}

/** Verify LINE webhook signature (X-Line-Signature) */
export function verifySignature(body: string, signature: string): boolean {
    const hash = createHmac('SHA256', getChannelSecret())
        .update(body)
        .digest('base64');
    return hash === signature;
}

/** Reply message via LINE Messaging API (free — no push cost) */
export async function replyMessage(replyToken: string, messages: unknown[]): Promise<void> {
    const res = await fetch(`${LINE_API_BASE}/message/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getChannelAccessToken()}`,
        },
        body: JSON.stringify({ replyToken, messages }),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        console.error('LINE reply failed:', res.status, errorBody);
        throw new Error(`LINE reply failed: ${res.status}`);
    }
}
