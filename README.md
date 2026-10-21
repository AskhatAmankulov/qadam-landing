# Qadam Academy — мультиязычный лендинг (демо)

Лендинг курса программирования для школьников на трёх языках (қазақша / русский / English) с формой заявки, которая приходит в Telegram.

**Стек:** HTML, CSS, vanilla JS, Vercel Serverless Function (Node.js), Telegram Bot API.

## Что внутри
- **i18n без фреймворка:** словари в `assets/i18n.js`, разметка через `data-i18n`, отдельные URL `/kk`, `/ru`, `/en`, теги `hreflang`, запоминание языка.
- **Форма заявки:** валидация, маска телефона +7, honeypot от спама, передача UTM-меток и языка сайта.
- **Безопасность:** токен бота хранится в переменных окружения Vercel (`api/lead.js`), во фронтенде его нет.
- **SEO:** meta и Open Graph, `sitemap.xml`, `robots.txt`, семантическая вёрстка.
- **Адаптив:** mobile-first, без библиотек.

## Деплой
1. Импортировать репозиторий в Vercel.
2. В Settings → Environment Variables добавить `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`.
3. Redeploy.
