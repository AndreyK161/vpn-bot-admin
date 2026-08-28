"""Разовое переименование Название (title) у уже импортированных шаблонов —
человекочитаемые названия вместо технических ключей. Key не трогает, ничего
в боте не меняет — чисто косметика для админки.

Запуск (из контейнера backend):

    python scripts/rename_template_titles.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import async_session  # noqa: E402
from app.models.message_template import MessageTemplate  # noqa: E402

TITLES: dict[str, str] = {
    "TECHNICAL_WORK_MESSAGE": "Технические работы",
    "WELCOME_MESSAGE": "Приветствие нового пользователя",
    "WELCOME_MESSAGE_TRIAL_USER_CREATED": "Приветствие с выдачей пробного доступа",
    "WELCOME_MESSAGE_REFERRAL": "Приветствие по реферальной ссылке",
    "SOMETHING_WRONG": "Что-то пошло не так (общая ошибка)",
    "YOUR_KEY": "Выдача ключа подключения",
    "MY_PROFILE": "Мой профиль",
    "MY_PROFILE_TRAFFIC_LIMIT": "Мой профиль (с лимитом трафика)",
    "SELECT_TARIFF": "Выбор тарифа",
    "SELECT_YOUR_DEVICE": "Выбор устройства для инструкции",
    "RENEW": "Ключ истёк — предложение продлить",
    "INVALID_PRICE": "Ошибка: неверная сумма платежа",
    "INVALID_INVOICE_PERIOD": "Ошибка: неверный период оплаты",
    "CANCELED_PAYMENT": "Автооплата не прошла — подписка отменена",
    "PAY_BUTTON_TEXT": "Кнопка «Оплатить»",
    "NO_AUTOPAY_TO_CANCEL": "Автопродление и так не подключено",
    "AUTOPAY_CANCELED": "Автопродление отменено",
    "CANCEL_AUTOPAY_OBJECTION": "Возражение перед отменой автопродления",
    "REJECT_CANCEL_AUTOPAY_THANKS": "Спасибо, что остались (отмена отменена)",
    "QUESTIONS": "Меню вопросов",
    "NO_WL_ANSWER": "Ответ: как активировать белый список",
    "VPN_DOEST_WORK_ANSWER": "Ответ: VPN не работает",
    "HOW_TO_CANCEL_SUBSCRIPTION_ANSWER": "Ответ: как отменить подписку",
    "BLOCK_ADULT_WEBSITES_ANSWER": "Ответ: блокировка сайтов для взрослых",
    "SUPPORT_ANSWER": "Ответ: связаться с поддержкой",
    "INSTALL_ON_ANDROID_INSTRUCTION": "Инструкция по установке — Android",
    "INSTALL_ON_APPLE_INSTRUCTION": "Инструкция по установке — iOS",
    "INSTALL_ON_WINDOWS_INSTRUCTION": "Инструкция по установке — Windows",
    "YOUR_PAYMENT": "Счёт на оплату",
    "SUSPICIOUS_DISPLAY_NAME_BLOCKED": "Блокировка подозрительного имени профиля",
    "REFERRAL_PROGRAM": "Реферальная программа",
    "NOTIFY_REFERRAL_TRAFFIC_REACHED_BONUS": "Бонус за активность приглашённого друга",
    "NOTIFY_REFERRAL_PURCHASE_BONUS_APPLIED": "Бонус за оплату приглашённого друга",
    "SHARE_REFERRAL_TEXT": "Текст для шаринга реферальной ссылки",
    "NOTIFY_YESTERDAY_CREATED1": "Напоминание не попробовавшим (вариант 1)",
    "NOTIFY_YESTERDAY_CREATED2": "Напоминание не попробовавшим (вариант 2)",
    "NOTIFY_YESTERDAY_CREATED3": "Напоминание не попробовавшим (вариант 3)",
    "NOTIFY_EXPIRED_USER": "Подписка истекла",
    "NOTIFY_EXPIRED_USER_PROMO1": "Подписка истекла — промо на 3 дня (вариант 1)",
    "NOTIFY_EXPIRED_USER_PROMO2": "Подписка истекла — промо на 3 дня (вариант 2)",
    "NOTIFY_EXPIRED_USER_PROMO3": "Подписка истекла — промо на 3 дня (вариант 3)",
    "NOTIFY_EXPIRED_USER_PROMO4": "Подписка истекла — промо на 3 дня (вариант 4)",
    "NOTIFY_EXPIRED_USER_PROMO5": "Подписка истекла — промо на 3 дня (вариант 5)",
    "NOTIFY_ONE_DAY_LEFT": "Остался 1 день подписки",
    "NOTIFY_ONE_DAY_LEFT_PROMO": "Остался 1 день — промо на 3 дня",
    "NOTIFY_THREE_DAYS_LEFT": "Осталось 3 дня подписки",
    "NOTIFY_THREE_DAYS_LEFT_PROMO": "Осталось 3 дня (пробный) — промо на продление",
    "NOTIFY_AUTOPAY_FAILURE": "Не удалось списать автоплатёж",
    "NOTIFY_NON_AUTOPAY_FAILURE": "Оплата не прошла",
    "NOTIFY_SUCCESSFUL_NON_AUTOPAY": "Оплата прошла успешно (с указанием дней)",
    "NOTIFY_SUCCESSFUL_NON_AUTOPAY_FALLBACK": "Оплата прошла успешно",
    "INSTALL_VPN_BUTTON": "Кнопка «Подключиться»",
    "MY_PROFILE_BUTTON": "Кнопка «Мой профиль»",
    "ANDROID_BUTTON": "Кнопка «Android»",
    "IOS_BUTTON": "Кнопка «iOS»",
    "WINDOWS_BUTTON": "Кнопка «Windows»",
    "MACOS_BUTTON": "Кнопка «MacOS»",
    "PROLONG_BUTTON": "Кнопка «Продлить»",
    "TARIFFS_BUTTON": "Кнопка «Тарифы»",
    "QUESTIONS_BUTTON": "Кнопка «Поддержка» (меню)",
    "INVITE_FRIEND_BUTTON": "Кнопка «Пригласить друга»",
    "NO_WL_BUTTON": "Кнопка «У меня нет белых списков»",
    "VPN_DOESNT_WORK_BUTTON": "Кнопка «Нет интернета при подключении»",
    "CANCEL_SUBSCRIPTION_BUTTON": "Кнопка «Отменить подписку»",
    "BLOCK_ADULT_WEBSITES_BUTTON": "Кнопка «Блокировка сайтов для взрослых»",
    "SUPPORT_BUTTON": "Кнопка «Техническая поддержка»",
    "SAVE_RECURRENT_PAYMENT_BUTTON": "Кнопка «Оставить автопродление»",
    "CANCEL_RECURRENT_PAYMENT_BUTTON": "Кнопка «Всё-таки отменить»",
    "ONE_CLICK_INSTALL_BUTTON": "Кнопка «Подключиться в 1 клик»",
    "BACK_TO_QUESTIONS_BUTTON": "Кнопка «Назад» (к вопросам)",
    "THREE_DAYS_PROMO_TARIFF_BUTTON": "Кнопка тарифа: промо на 3 дня",
    "ONE_DAY_TARIFF_BUTTON": "Кнопка тарифа: 1 день",
    "ONE_MONTH_TARIFF_BUTTON": "Кнопка тарифа: 1 месяц",
    "THREE_MONTHS_TARIFF_BUTTON": "Кнопка тарифа: 3 месяца",
    "SIX_MONTHS_TARIFF_BUTTON": "Кнопка тарифа: 6 месяцев",
    "ONE_YEAR_TARIFF_BUTTON": "Кнопка тарифа: 12 месяцев",
    "SUBSCRIBE_ON_CHANNEL": "Кнопка «Подписаться на канал»",
}


async def rename_titles() -> None:
    async with async_session() as db:
        result = await db.execute(select(MessageTemplate))
        templates = {t.key: t for t in result.scalars().all()}

        updated = []
        not_found = []
        for key, title in TITLES.items():
            template = templates.get(key)
            if template is None:
                not_found.append(key)
                continue
            template.title = title
            updated.append(key)

        await db.commit()

    print(f"Обновлено: {len(updated)}")
    print(f"Не найдено в БД (пропущено): {len(not_found)}")
    for key in not_found:
        print(f"  ? {key}")


if __name__ == "__main__":
    asyncio.run(rename_titles())
