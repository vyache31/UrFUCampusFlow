import uuid
from datetime import UTC, datetime

from models import EvaluationForm, EvaluationFormComments, EvaluationFormReactions
from repositories.case_repository import CaseRepository
from repositories.evaluation_repository import EvaluationRepository
from schemas.evaluation_schemas import (
    EvaluationCommentCreate,
    EvaluationCommentResponse,
    EvaluationCommentUpdate,
    EvaluationFormResponse,
    EvaluationReactionCreate,
    EvaluationReactionResponse,
    EvaluationReactionUpdate,
    ReactionType,
)


class EvaluationService:
    def __init__(self, repo: EvaluationRepository, case_repo: CaseRepository):
        self.repo = repo
        self.case_repo = case_repo

    async def create_evaluation_form(
        self, case_id: str, creator_id: str
    ) -> EvaluationFormResponse:
        case = await self.case_repo.get_by_id(case_id)

        if not case:
            raise ValueError("Case with this id not found")

        if case.status.code != "IN_REVIEW":
            raise ValueError("Case status must be IN_REVIEW")

        created_form = EvaluationForm(
            id=str(uuid.uuid4()),
            case_id=case_id,
            creator_id=creator_id,
            created_at=datetime.now(UTC),
        )

        await self.repo.create_form(created_form)

        return self._to_response_form(created_form)

    async def evaluation_reaction_create(
        self, user_id: str, schema: EvaluationReactionCreate
    ) -> EvaluationReactionResponse:
        if not await self.repo.get_form_by_id(schema.evaluation_form_id):
            raise ValueError("This form does not exist")

        existing_reaction = await self.repo.get_reaction_by_form_and_user(
            schema.evaluation_form_id, user_id
        )

        if existing_reaction:
            raise ValueError("User has already reacted to this form")

        created_reaction = EvaluationFormReactions(
            id=str(uuid.uuid4()),
            evaluation_form_id=schema.evaluation_form_id,
            user_id=user_id,
            reaction=schema.reaction.value,
            created_at=datetime.now(UTC),
        )

        await self.repo.create_reaction(created_reaction)

        return self._to_response_reaction(created_reaction)

    async def evaluation_comment_create(
        self, user_id: str, schema: EvaluationCommentCreate
    ) -> EvaluationCommentResponse:
        if not await self.repo.get_form_by_id(schema.evaluation_form_id):
            raise ValueError("This form does not exist")

        created_comment = EvaluationFormComments(
            id=str(uuid.uuid4()),
            evaluation_form_id=schema.evaluation_form_id,
            user_id=user_id,
            comment_text=schema.comment_text,
            created_at=datetime.now(UTC),
        )

        await self.repo.create_comment(created_comment)

        return self._to_response_comment(created_comment)

    async def evaluation_reaction_update(
        self,
        reaction_id: str,
        user_id: str,
        schema: EvaluationReactionUpdate,
    ) -> EvaluationReactionResponse:
        reaction = await self.repo.get_reaction_by_id(reaction_id)

        if not reaction:
            raise ValueError("This reaction does not exist")

        if reaction.user_id != user_id:
            raise ValueError("You cannot update this reaction")

        update_data = schema.model_dump(exclude_unset=True, exclude_none=True)

        if "reaction" in update_data:
            reaction.reaction = update_data["reaction"].value

        reaction.updated_at = datetime.now(UTC)

        await self.repo.update_reaction(reaction)

        return self._to_response_reaction(reaction)

    async def evaluation_comment_update(
        self,
        comment_id: str,
        user_id: str,
        schema: EvaluationCommentUpdate,
    ) -> EvaluationCommentResponse:
        comment = await self.repo.get_comment_by_id(comment_id)

        if not comment:
            raise ValueError("This comment does not exist")

        if comment.user_id != user_id:
            raise ValueError("You cannot update this comment")

        update_data = schema.model_dump(exclude_unset=True, exclude_none=True)

        for field, value in update_data.items():
            setattr(comment, field, value)

        comment.updated_at = datetime.now(UTC)

        await self.repo.update_comment(comment)

        return self._to_response_comment(comment)

    async def get_evaluation_form_by_id(
        self, form_id: str
    ) -> EvaluationFormResponse | None:
        form = await self.repo.get_form_by_id(form_id)

        if not form:
            return None

        return self._to_response_form(form)

    async def get_evaluation_forms_by_case_id(
        self, case_id: str
    ) -> list[EvaluationFormResponse]:
        forms = await self.repo.get_forms_by_case_id(case_id)

        return [self._to_response_form(form) for form in forms]

    async def get_current_evaluation_form_by_case_id(
        self, case_id: str
    ) -> EvaluationFormResponse | None:
        form = await self.repo.get_current_form_by_case_id(case_id)

        if not form:
            return None

        return self._to_response_form(form)

    async def get_evaluation_reaction_by_id(
        self, reaction_id: str
    ) -> EvaluationReactionResponse | None:
        reaction = await self.repo.get_reaction_by_id(reaction_id)

        if not reaction:
            return None

        return self._to_response_reaction(reaction)

    async def get_evaluation_reactions_by_form_id(
        self, form_id: str
    ) -> list[EvaluationReactionResponse]:
        reactions = await self.repo.get_reactions_by_evaluation_form_id(form_id)

        return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_all_evaluation_reactions(
        self,
    ) -> list[EvaluationReactionResponse]:
        reactions = await self.repo.get_all_reactions()

        return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_evaluation_reactions_by_type(
        self, reaction_type: ReactionType
    ) -> list[EvaluationReactionResponse]:
        reactions = await self.repo.get_reactions_by_type(reaction_type.value)

        return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_evaluation_reaction_by_form_and_user(
        self, form_id: str, user_id: str
    ) -> EvaluationReactionResponse | None:
        reaction = await self.repo.get_reaction_by_form_and_user(form_id, user_id)

        if not reaction:
            return None

        return self._to_response_reaction(reaction)

    async def get_evaluation_comment_by_id(
        self, comment_id: str
    ) -> EvaluationCommentResponse | None:
        comment = await self.repo.get_comment_by_id(comment_id)

        if not comment:
            return None

        return self._to_response_comment(comment)

    async def get_evaluation_comments_by_form_id(
        self, form_id: str
    ) -> list[EvaluationCommentResponse]:
        comments = await self.repo.get_comments_by_evaluation_form_id(form_id)

        return [self._to_response_comment(comment) for comment in comments]

    @staticmethod
    def _to_response_form(form: EvaluationForm) -> EvaluationFormResponse:
        return EvaluationFormResponse(
            id=form.id,
            case_id=form.case_id,
            creator_id=form.creator_id,
            created_at=form.created_at,
        )

    @staticmethod
    def _to_response_reaction(
        reaction: EvaluationFormReactions,
    ) -> EvaluationReactionResponse:
        return EvaluationReactionResponse(
            id=reaction.id,
            evaluation_form_id=reaction.evaluation_form_id,
            user_id=reaction.user_id,
            created_at=reaction.created_at,
            updated_at=reaction.updated_at,
            reaction=ReactionType(reaction.reaction),
        )

    @staticmethod
    def _to_response_comment(
        comment: EvaluationFormComments,
    ) -> EvaluationCommentResponse:
        return EvaluationCommentResponse(
            id=comment.id,
            evaluation_form_id=comment.evaluation_form_id,
            user_id=comment.user_id,
            comment_text=comment.comment_text,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
