import TelegramBot from "node-telegram-bot-api";
import { prisma } from "../lib/prisma";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const send = (chatId: string | number, text: string) =>
  bot.sendMessage(chatId, text, { parse_mode: "HTML" });

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const startToken = match?.[1]?.trim();

  if (!startToken) {
    await send(
      chatId,
      "👋 Send /start <token> from your ResourceMaster link to connect."
    );
    return;
  }

  try {
    const link = await prisma.telegramLink.findFirst({
      where: { secureToken: startToken, bonded: false },
      include: { user: { select: { username: true, role: true } } },
    });

    if (!link) {
      await send(
        chatId,
        "❌ Invalid or expired link. Please generate a new connection link from the Settings page."
      );
      return;
    }

    if (link.tokenExpires && new Date() > link.tokenExpires) {
      await send(chatId, "❌ This link has expired. Generate a new one.");
      return;
    }

    await prisma.telegramLink.update({
      where: { id: link.id },
      data: {
        chatId,
        bonded: true,
        secureToken: null,
        tokenExpires: null,
      },
    });

    await send(
      chatId,
      `✅ <b>Connected!</b>\nUser: <b>${link.user.username}</b>\nRole: ${link.user.role.replace(
        /_/g,
        " "
      )}`
    );
  } catch (e) {
    console.error(e);
    await send(chatId, "⚠️ Error connecting. Try again.");
  }
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id.toString();
  try {
    const link = await prisma.telegramLink.findFirst({
      where: { chatId, bonded: true },
      include: { user: { select: { username: true, role: true } } },
    });

    if (link) {
      await send(
        chatId,
        `📊 <b>Status</b>\nConnected as <b>${link.user.username}</b>\nRole: ${link.user.role.replace(
          /_/g,
          " "
        )}`
      );
    } else {
      await send(chatId, "❌ Not connected. Use /start <token>.");
    }
  } catch (e) {
    console.error(e);
    await send(chatId, "⚠️ Error checking status.");
  }
});

bot.onText(/\/disconnect/, async (msg) => {
  const chatId = msg.chat.id.toString();
  try {
    const link = await prisma.telegramLink.findFirst({
      where: { chatId, bonded: true },
    });
    if (!link) {
      await send(chatId, "Not connected.");
      return;
    }
    await prisma.telegramLink.update({
      where: { id: link.id },
      data: { bonded: false, chatId: null, secureToken: null, tokenExpires: null },
    });
    await send(chatId, "🔌 Disconnected.");
  } catch (e) {
    console.error(e);
    await send(chatId, "⚠️ Error disconnecting.");
  }
});

console.log("🤖 Local Telegram bot running with polling. Press Ctrl+C to stop.");

