export const CONFIG = {
    API_BASE: '/api/email',
    DOMAINS: [
        'guerrillamail.com',
        'guerrillamail.net',
        'guerrillamail.org',
        'guerrillamailblock.com',
        'grr.la',
        'pokemail.net',
        'spam4.me'
    ],
};

interface ApiEmail extends Omit<Email, 'mail_id'> {
  mail_id: number;
}

export interface Email {
    mail_id: string;
    mail_from: string;
    mail_subject: string;
    mail_excerpt: string;
    mail_timestamp: number;
    read: number;
    mail_date: string;
    mail_size: string;
    mail_body?: string; // Optional: For locally generated emails like welcomes
}

export interface Session {
    sid_token: string;
    email_addr: string;
    alias: string;
    stats: {
        sequence_mail: string;
        created_addresses: number;
        total: string;
    }
}

export interface EmailResponse {
    list: Email[];
    count: number;
    email: string;
    alias: string;
    ts: number;
    sid_token: string;
}

export async function getSession(): Promise<Session> {
    const response = await fetch(`${CONFIG.API_BASE}?f=get_email_address`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

export async function setEmailUser(sid: string, emailUser: string, domain: string): Promise<Session> {
    const response = await fetch(`${CONFIG.API_BASE}?f=set_email_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `sid_token=${sid}&email_user=${emailUser}&domain=${domain}`
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

export async function checkEmail(sid: string): Promise<EmailResponse> {
    const res = await fetch(`${CONFIG.API_BASE}?f=get_email_list&offset=0&sid_token=${sid}`);
    if (!res.ok) throw new Error('Failed to check email');
    const data = await res.json();
    const list = data.list
        ? data.list
            .map((e: ApiEmail) => ({ ...e, mail_id: String(e.mail_id) }))
            .filter((e: Email) => e.mail_from.trim().toLowerCase() !== 'no-reply@guerrillamail.com')
        : [];
    return { ...data, list };
}

export async function readEmail(sid: string, mailId: string): Promise<{ mail_body: string }> {
    const res = await fetch(`${CONFIG.API_BASE}?f=fetch_email&sid_token=${sid}&email_id=${mailId}`);
    if (!res.ok) throw new Error('Failed to read email');
    return res.json();
}

export const forgetSession = async (sidToken: string): Promise<boolean> => {
    try {
        const res = await fetch(`${CONFIG.API_BASE}?f=forget_me&sid_token=${sidToken}`);
        if (!res.ok) {
            console.error('Forget session request failed with status:', res.status);
            return false;
        }
        const data = await res.json();
        return data === true;
    } catch (error) {
        console.error('Failed to forget session:', error);
        return false;
    }
};
