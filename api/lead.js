// Vercel Serverless Function: принимает заявку с сайта и отправляет её в Telegram.
// Токен бота хранится в переменных окружения Vercel и не попадает в браузер.

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

const FORMATS = { online: "Онлайн", offline: "Офлайн (Астана)" };
const LANGS = { kk: "Қазақша", ru: "Русский", en: "English" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // Honeypot: если скрытое поле заполнено — это бот, делаем вид, что всё ок
  if (body.website) return res.status(200).json({ ok: true });

  const name = String(body.name || "").trim().slice(0, 80);
  const phone = String(body.phone || "").trim();
  if (name.length < 2 || phone.replace(/\D/g, "").length !== 11) {
    return res.status(400).json({ ok: false, error: "Invalid name or phone" });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ ok: false, error: "Telegram is not configured" });
  }

  const time = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" });
  const lines = [
    "🎓 <b>Новая заявка на пробный урок</b>",
    "",
    "👤 Имя: " + escapeHtml(name),
    "📞 Телефон: " + escapeHtml(phone),
    "🧒 Возраст: " + escapeHtml(body.age || "—"),
    "💻 Формат: " + escapeHtml(FORMATS[body.format] || "—"),
    "🌐 Язык сайта: " + escapeHtml(LANGS[body.lang] || "—"),
    body.utm_source ? "📈 UTM: " + escapeHtml(body.utm_source) + " / " + escapeHtml(body.utm_campaign || "—") : null,
    "🕒 " + time
  ].filter((l) => l !== null);

  try {
    const tg = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" })
    });
    if (!tg.ok) throw new Error("Telegram " + tg.status + ": " + (await tg.text()));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ ok: false, error: "Failed to deliver" });
  }
}
