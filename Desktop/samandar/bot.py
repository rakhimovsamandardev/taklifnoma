from __future__ import annotations

import asyncio
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message
from dotenv import load_dotenv

from parser import search_olx

load_dotenv()

TOKEN = os.getenv("BOT_TOKEN")
if not TOKEN:
    raise RuntimeError("BOT_TOKEN .env faylida yo'q")

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message) -> None:
    await message.answer(
        "Salom! OLX'dan qidirish uchun so'z yuboring.\nMasalan: iphone 13"
    )


@dp.message(F.text)
async def handle_query(message: Message) -> None:
    query = message.text.strip()
    wait = await message.answer("Qidirilmoqda...")

    try:
        ads = await search_olx(query)
    except Exception:
        await wait.edit_text("OLX'dan ma'lumot olishda xatolik yuz berdi.")
        return

    if not ads:
        await wait.edit_text("Hech narsa topilmadi.")
        return

    lines = []
    for ad in ads:
        lines.append(f"<b>{ad['title']}</b>\n{ad['price']}\n{ad['url']}")

    await wait.edit_text(
        "\n\n".join(lines),
        parse_mode="HTML",
        disable_web_page_preview=True,
    )


async def main() -> None:
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
