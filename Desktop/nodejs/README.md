## Telegram Real Estate Bot (Node.js + Telegraf)

SQLite-backed user state (`state`, JSON `state_data`), layered controllers/services/repositories, i18n via `translate(key, lang)`, and debounced handling of Telegram media groups during the Add House flow.

### Quick start

1. Copy `.env.example` → `.env` and set `BOT_TOKEN`.
2. Install and run:

```bash
npm install
npm start
```

SQLite data is stored at `DATABASE_PATH` (default `./data/bot.sqlite`).
