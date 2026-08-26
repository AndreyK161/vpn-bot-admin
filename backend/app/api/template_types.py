from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.template_type import TemplateType
from app.schemas.template_type import TemplateTypeCreate, TemplateTypeOut

router = APIRouter(
    prefix="/api/template-types",
    tags=["template-types"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[TemplateTypeOut])
async def list_template_types(db: AsyncSession = Depends(get_db)) -> list[TemplateTypeOut]:
    result = await db.execute(select(TemplateType).order_by(TemplateType.key))
    return [TemplateTypeOut.model_validate(t) for t in result.scalars().all()]


@router.post("", response_model=TemplateTypeOut, status_code=status.HTTP_201_CREATED)
async def create_template_type(
    payload: TemplateTypeCreate, db: AsyncSession = Depends(get_db)
) -> TemplateTypeOut:
    template_type = TemplateType(key=payload.key, label=payload.label)
    db.add(template_type)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Тип с ключом {payload.key!r} уже существует",
        ) from exc
    await db.refresh(template_type)
    return TemplateTypeOut.model_validate(template_type)
