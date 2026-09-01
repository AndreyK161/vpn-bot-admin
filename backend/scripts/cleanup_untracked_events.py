"""Разовая чистка bot_events от шума, накопленного до сужения трекинга —
удаляет всё, кроме оплаты/ошибок/триала/предложений купить и фидбека
из action-controll. Запуск (из контейнера backend):

    python scripts/cleanup_untracked_events.py          # только покажет, что удалит
    python scripts/cleanup_untracked_events.py --apply   # реально удалит
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from sqlalchemy import delete, func, select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import async_session  # noqa: E402
from app.models.bot_event import BotEvent  # noqa: E402

# Из utils/translator.py (TRACKED_KEYS) — оплата / глобальные ошибки / триал
TRACKED_LOCALE_KEYS = {
    "YOUR_PAYMENT",
    "CANCELED_PAYMENT",
    "INVALID_PRICE",
    "INVALID_INVOICE_PERIOD",
    "NOTIFY_SUCCESSFUL_NON_AUTOPAY",
    "NOTIFY_SUCCESSFUL_NON_AUTOPAY_FALLBACK",
    "NOTIFY_AUTOPAY_FAILURE",
    "NOTIFY_NON_AUTOPAY_FAILURE",
    "NO_AUTOPAY_TO_CANCEL",
    "AUTOPAY_CANCELED",
    "CANCEL_AUTOPAY_OBJECTION",
    "REJECT_CANCEL_AUTOPAY_THANKS",
    "SOMETHING_WRONG",
    "TECHNICAL_WORK_MESSAGE",
    "WELCOME_MESSAGE_TRIAL_USER_CREATED",
    "NOTIFY_YESTERDAY_CREATED1",
    "NOTIFY_YESTERDAY_CREATED2",
    "NOTIFY_YESTERDAY_CREATED3",
    "NOTIFY_EXPIRED_USER_PROMO1",
    "NOTIFY_EXPIRED_USER_PROMO2",
    "NOTIFY_EXPIRED_USER_PROMO3",
    "NOTIFY_EXPIRED_USER_PROMO4",
    "NOTIFY_EXPIRED_USER_PROMO5",
}

# Из utils/notifications.py — проактивные предложения купить + сигналы оплаты
NOTIFICATION_TYPES = {
    "subscription-expired",
    "3-days-left",
    "1-day-left",
    "nc-yesterday-created",
    "purchase-success-autopay",
    "purchase-success-non-autopay",
}

# Из shredder-action-controll (texts/messages.yml) — фидбек по триалу
ACTION_CONTROLL_TYPES = {
    "trial_feedback",
    "trial_feedback_followup",
    "short_feedback_oneday",
    "short_feedback_oneday_followup",
    "short_feedback_threedays",
    "short_feedback_threedays_followup",
    "followup",
}

KEEP_EVENT_TYPES = TRACKED_LOCALE_KEYS | NOTIFICATION_TYPES | ACTION_CONTROLL_TYPES


async def cleanup(apply: bool) -> None:
    async with async_session() as db:
        stmt = (
            select(BotEvent.event_type, func.count())
            .where(BotEvent.event_type.notin_(KEEP_EVENT_TYPES))
            .group_by(BotEvent.event_type)
            .order_by(func.count().desc())
        )
        rows = (await db.execute(stmt)).all()

        if not rows:
            print("Мусора не найдено — чистить нечего.")
            return

        total = sum(count for _, count in rows)
        print(f"Будет удалено {total} событий по {len(rows)} типам:")
        for event_type, count in rows:
            print(f"  - {event_type}: {count}")

        if not apply:
            print("\nЭто был dry-run. Чтобы реально удалить, запусти с --apply")
            return

        result = await db.execute(
            delete(BotEvent).where(BotEvent.event_type.notin_(KEEP_EVENT_TYPES))
        )
        await db.commit()
        print(f"\nУдалено {result.rowcount} событий.")


if __name__ == "__main__":
    asyncio.run(cleanup(apply="--apply" in sys.argv))
