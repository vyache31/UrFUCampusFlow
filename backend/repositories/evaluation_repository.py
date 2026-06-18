from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import EvaluationForm, EvaluationFormComments, EvaluationFormReactions


class EvaluationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_reaction(
        self, reaction: EvaluationFormReactions
    ) -> EvaluationFormReactions:
        self.db.add(reaction)

        await self.db.commit()
        await self.db.refresh(reaction)

        return reaction

    async def get_reaction_by_id(
        self, reaction_id: str
    ) -> EvaluationFormReactions | None:
        reaction = await self.db.execute(
            select(EvaluationFormReactions).where(
                EvaluationFormReactions.id == reaction_id
            )
        )

        return reaction.scalar_one_or_none()

    async def get_reactions_by_evaluation_form_id(
        self, form_id: str
    ) -> list[EvaluationFormReactions]:
        reactions = await self.db.execute(
            select(EvaluationFormReactions).where(
                EvaluationFormReactions.evaluation_form_id == form_id
            )
        )

        return [reaction for reaction in reactions.scalars().all()]

    async def get_all_reactions(self) -> list[EvaluationFormReactions]:
        reactions = await self.db.execute(
            select(EvaluationFormReactions)
            .order_by(EvaluationFormReactions.created_at.desc())
        )

        return [reaction for reaction in reactions.scalars().all()]

    async def get_reactions_by_type(
        self, reaction_type: str
    ) -> list[EvaluationFormReactions]:
        reactions = await self.db.execute(
            select(EvaluationFormReactions)
            .where(EvaluationFormReactions.reaction == reaction_type)
            .order_by(EvaluationFormReactions.created_at.desc())
        )

        return [reaction for reaction in reactions.scalars().all()]

    async def update_reaction(
        self, reaction: EvaluationFormReactions
    ) -> EvaluationFormReactions | None:
        await self.db.commit()
        await self.db.refresh(reaction)

        return reaction

    async def get_reaction_by_form_and_user(
        self, form_id: str, user_id: str
    ) -> EvaluationFormReactions | None:
        reaction = await self.db.execute(
            select(EvaluationFormReactions).where(
                EvaluationFormReactions.evaluation_form_id == form_id,
                EvaluationFormReactions.user_id == user_id,
            )
        )

        return reaction.scalar_one_or_none()

    async def delete_reaction(self, reaction: EvaluationFormReactions) -> None:
        await self.db.delete(reaction)
        await self.db.commit()

    async def create_form(self, form: EvaluationForm) -> EvaluationForm:
        self.db.add(form)

        await self.db.commit()
        await self.db.refresh(form)

        return form

    async def get_form_by_id(self, form_id: str) -> EvaluationForm | None:
        form = await self.db.execute(
            select(EvaluationForm).where(EvaluationForm.id == form_id)
        )

        return form.scalar_one_or_none()

    async def get_forms_by_case_id(self, case_id: str) -> list[EvaluationForm]:
        forms = await self.db.execute(
            select(EvaluationForm)
            .where(EvaluationForm.case_id == case_id)
            .order_by(EvaluationForm.created_at.asc(), EvaluationForm.id.asc())
        )

        return [form for form in forms.scalars().all()]

    async def get_current_form_by_case_id(self, case_id: str) -> EvaluationForm | None:
        form = await self.db.execute(
            select(EvaluationForm)
            .where(EvaluationForm.case_id == case_id)
            .order_by(EvaluationForm.created_at.desc(), EvaluationForm.id.desc())
            .limit(1)
        )

        return form.scalar_one_or_none()

    async def create_comment(
        self, comment: EvaluationFormComments
    ) -> EvaluationFormComments:
        self.db.add(comment)

        await self.db.commit()
        await self.db.refresh(comment)

        return comment

    async def get_comment_by_id(self, comment_id: str) -> EvaluationFormComments | None:
        comment = await self.db.execute(
            select(EvaluationFormComments).where(
                EvaluationFormComments.id == comment_id
            )
        )

        return comment.scalar_one_or_none()

    async def get_comments_by_evaluation_form_id(
        self, form_id: str
    ) -> list[EvaluationFormComments]:
        comments = await self.db.execute(
            select(EvaluationFormComments)
            .where(EvaluationFormComments.evaluation_form_id == form_id)
            .order_by(EvaluationFormComments.created_at.asc())
        )

        return [comment for comment in comments.scalars().all()]

    async def update_comment(
        self, comment: EvaluationFormComments
    ) -> EvaluationFormComments | None:
        await self.db.commit()
        await self.db.refresh(comment)

        return comment

    async def delete_comment(self, comment: EvaluationFormComments) -> None:
        await self.db.delete(comment)
        await self.db.commit()
