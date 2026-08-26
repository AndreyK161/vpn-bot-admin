"""Создать первого администратора: python -m app.scripts.create_admin"""

import argparse
import asyncio
import getpass

from sqlalchemy import select

from app.core.database import async_session
from app.core.security import hash_password
from app.models.admin_user import AdminUser


async def create_admin(email: str, password: str, full_name: str | None) -> None:
    async with async_session() as db:
        existing = await db.execute(select(AdminUser).where(AdminUser.email == email))
        if existing.scalar_one_or_none():
            print(f"Пользователь {email} уже существует")
            return

        user = AdminUser(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
        )
        db.add(user)
        await db.commit()
        print(f"Администратор {email} создан")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--full-name", default=None)
    args = parser.parse_args()

    password = getpass.getpass("Пароль: ")
    password_confirm = getpass.getpass("Повторите пароль: ")
    if password != password_confirm:
        raise SystemExit("Пароли не совпадают")

    asyncio.run(create_admin(args.email, password, args.full_name))


if __name__ == "__main__":
    main()
