# Import models here so Alembic autogenerate can see them via Base.metadata.
from app.models.admin_user import AdminUser  # noqa: F401
from app.models.bot_event import BotEvent  # noqa: F401
from app.models.template_type import TemplateType  # noqa: F401
from app.models.message_template import MessageTemplate  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
