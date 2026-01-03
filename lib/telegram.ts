// Telegram Bot API helper library

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramNotification(
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Generate a secure one-time token for Telegram connection
 */
export function generateSecureToken(): string {
  // Generate a random UUID-like token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the Telegram bot connection link with token
 */
export function getTelegramBotLink(token: string): string {
  // Direct link format that works better
  return `https://t.me/ResourceMasterBot?start=${token}`;
}

/**
 * Get deep link that opens Telegram app directly
 */
export function getTelegramDeepLink(token: string): string {
  // Use the direct bot link - works on mobile and desktop
  return `https://t.me/ResourceMasterBot?start=${token}`;
}

/**
 * Check if a message urgency matches user's notification preference
 */
export function shouldNotify(
  messageContent: string,
  preference: 'URGENT_ONLY' | 'URGENT_AND_SERIOUS' | 'OFF'
): boolean {
  if (preference === 'OFF') {
    return false;
  }

  const isUrgent = messageContent.includes('🚨 URGENT') || 
                   messageContent.includes('URGENT ALERT') ||
                   messageContent.includes('[URGENT]');
  
  const isSerious = messageContent.includes('SERIOUS') || 
                    messageContent.includes('⚠️');

  if (preference === 'URGENT_ONLY') {
    return isUrgent;
  }

  if (preference === 'URGENT_AND_SERIOUS') {
    return isUrgent || isSerious;
  }

  return false;
}

/**
 * Format a message for Telegram (HTML)
 */
export function formatTelegramMessage(
  title: string,
  body: string,
  urgency?: 'urgent' | 'serious' | 'normal'
): string {
  const urgencyEmoji = urgency === 'urgent' ? '🚨' : urgency === 'serious' ? '⚠️' : '📋';
  
  return `${urgencyEmoji} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

