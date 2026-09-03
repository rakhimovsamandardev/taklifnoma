from __future__ import annotations

import aiohttp
from bs4 import BeautifulSoup

BASE_URL = "https://www.olx.uz"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}


async def search_olx(query: str, limit: int = 5) -> list[dict]:
    """OLX qidiruv sahifasidan e'lonlar ro'yxatini qaytaradi."""
    url = f"{BASE_URL}/list/q-{query.replace(' ', '-')}/"
    timeout = aiohttp.ClientTimeout(total=20)

    async with aiohttp.ClientSession(headers=HEADERS, timeout=timeout) as session:
        async with session.get(url) as resp:
            resp.raise_for_status()
            html = await resp.text()

    soup = BeautifulSoup(html, "html.parser")
    items: list[dict] = []

    for card in soup.select("[data-cy='l-card']")[:limit]:
        title_el = card.select_one("h4, h6, [data-cy='ad-card-title']")
        price_el = card.select_one("[data-testid='ad-price']") or card.select_one("p")
        link_el = card.select_one("a[href]")

        href = link_el["href"] if link_el else ""
        if href and href.startswith("/"):
            href = BASE_URL + href

        items.append(
            {
                "title": title_el.get_text(strip=True) if title_el else "Noma'lum",
                "price": price_el.get_text(strip=True) if price_el else "Narx yo'q",
                "url": href,
            }
        )

    return items
