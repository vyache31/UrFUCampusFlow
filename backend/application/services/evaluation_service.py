import uuid
from datetime import UTC, datetime

from application.interfaces.uow.evaluation_uow_protocol import EvaluationUoWProtocol
from infrastructure.db.models import (
    EvaluationForm,
    EvaluationFormComments,
    EvaluationFormReactions,
)
from presentation.api.schemas.evaluation_schemas import (
    EvaluationCommentCreate,
    EvaluationCommentResponse,
    EvaluationCommentUpdate,
    EvaluationCommentWs,
    EvaluationFormResponse,
    EvaluationReactionCreate,
    EvaluationReactionResponse,
    EvaluationReactionUpdate,
    LikesUpdatedWs,
    ReactionType,
)
from infrastructure.container import event_bus
from infrastructure.events.events import (
    CommentCreatedEvent,
    CommentUpdatedEvent,
    LikesUpdatedEvent,
)


class EvaluationService:
    def __init__(self, uow: EvaluationUoWProtocol):
        self.uow = uow

    async def _build_reaction_updated_event(
        self,
        uow: EvaluationUoWProtocol,
        reaction: EvaluationFormReactions,
    ) -> LikesUpdatedEvent:
        reaction_type = ReactionType(reaction.reaction)
        form_reactions = (
            await uow.evaluation_repository.get_reactions_by_evaluation_form_id(
                reaction.evaluation_form_id
            )
        )
        reactions_count = sum(
            item.reaction == reaction.reaction for item in form_reactions
        )

        reaction_event = LikesUpdatedWs(
            evaluation_form_id=reaction.evaluation_form_id,
            reactions_count=reactions_count,
            user_id=reaction.user_id,
            reaction=reaction_type,
        )

        return LikesUpdatedEvent(reaction_event)

    async def create_evaluation_form(
        self, case_id: str, creator_id: str
    ) -> EvaluationFormResponse:
        async with self.uow as uow:
            case = await uow.case_repository.get_by_id(case_id)

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

            await uow.evaluation_repository.create_form(created_form)
            response = self._to_response_form(created_form)

            await uow.commit()

            return response

    async def evaluation_reaction_create(
        self, user_id: str, schema: EvaluationReactionCreate
    ) -> EvaluationReactionResponse:
        async with self.uow as uow:
            if not await uow.evaluation_repository.get_form_by_id(
                schema.evaluation_form_id
            ):
                raise ValueError("This form does not exist")

            existing_reaction = (
                await uow.evaluation_repository.get_reaction_by_form_and_user(
                    schema.evaluation_form_id,
                    user_id,
                )
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

            await uow.evaluation_repository.create_reaction(created_reaction)
            event = await self._build_reaction_updated_event(uow, created_reaction)
            response = self._to_response_reaction(created_reaction)

            await uow.commit()

        await event_bus.publish(event)

        return response

    async def evaluation_comment_create(
        self,
        user_id: str,
        user_email: str,
        schema: EvaluationCommentCreate,
    ) -> EvaluationCommentResponse:
        async with self.uow as uow:
            if not await uow.evaluation_repository.get_form_by_id(
                schema.evaluation_form_id
            ):
                raise ValueError("This form does not exist")

            this_comment_uuid = str(uuid.uuid4())
            created_at = datetime.now(UTC)

            created_comment = EvaluationFormComments(
                id=this_comment_uuid,
                evaluation_form_id=schema.evaluation_form_id,
                user_id=user_id,
                comment_text=schema.comment_text,
                created_at=created_at,
            )

            comment_event = EvaluationCommentWs(
                id=this_comment_uuid,
                evaluation_form_id=schema.evaluation_form_id,
                user_id=user_id,
                user_email=user_email,
                comment_text=schema.comment_text,
                created_at=created_at,
            )

            await uow.evaluation_repository.create_comment(created_comment)
            response = self._to_response_comment(created_comment)

            await uow.commit()

        await event_bus.publish(CommentCreatedEvent(comment_event))

        return response

    async def evaluation_reaction_update(
        self,
        reaction_id: str,
        user_id: str,
        schema: EvaluationReactionUpdate,
    ) -> EvaluationReactionResponse:
        async with self.uow as uow:
            reaction = await uow.evaluation_repository.get_reaction_by_id(reaction_id)

            if not reaction:
                raise ValueError("This reaction does not exist")

            if reaction.user_id != user_id:
                raise ValueError("You cannot update this reaction")

            update_data = schema.model_dump(exclude_unset=True, exclude_none=True)

            if "reaction" in update_data:
                reaction.reaction = update_data["reaction"].value

            reaction.updated_at = datetime.now(UTC)

            await uow.evaluation_repository.update_reaction(reaction)
            event = await self._build_reaction_updated_event(uow, reaction)
            response = self._to_response_reaction(reaction)

            await uow.commit()

        await event_bus.publish(event)

        return response

    async def evaluation_comment_update(
        self,
        comment_id: str,
        user_id: str,
        user_email: str,
        schema: EvaluationCommentUpdate,
    ) -> EvaluationCommentResponse:
        async with self.uow as uow:
            comment = await uow.evaluation_repository.get_comment_by_id(comment_id)

            if not comment:
                raise ValueError("This comment does not exist")

            if comment.user_id != user_id:
                raise ValueError("You cannot update this comment")

            update_data = schema.model_dump(exclude_unset=True, exclude_none=True)

            for field, value in update_data.items():
                setattr(comment, field, value)

            comment.updated_at = datetime.now(UTC)

            await uow.evaluation_repository.update_comment(comment)

            comment_event = EvaluationCommentWs(
                id=comment.id,
                evaluation_form_id=comment.evaluation_form_id,
                user_id=comment.user_id,
                user_email=user_email,
                comment_text=comment.comment_text,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
            )
            response = self._to_response_comment(comment)

            await uow.commit()

        await event_bus.publish(CommentUpdatedEvent(comment_event))

        return response

    async def get_evaluation_form_by_id(
        self, form_id: str
    ) -> EvaluationFormResponse | None:
        async with self.uow as uow:
            form = await uow.evaluation_repository.get_form_by_id(form_id)

            if not form:
                return None

            return self._to_response_form(form)

    async def get_evaluation_forms_by_case_id(
        self, case_id: str
    ) -> list[EvaluationFormResponse]:
        async with self.uow as uow:
            forms = await uow.evaluation_repository.get_forms_by_case_id(case_id)

            return [self._to_response_form(form) for form in forms]

    async def get_current_evaluation_form_by_case_id(
        self, case_id: str
    ) -> EvaluationFormResponse | None:
        async with self.uow as uow:
            form = await uow.evaluation_repository.get_current_form_by_case_id(
                case_id
            )

            if not form:
                return None

            return self._to_response_form(form)

    async def get_evaluation_reaction_by_id(
        self, reaction_id: str
    ) -> EvaluationReactionResponse | None:
        async with self.uow as uow:
            reaction = await uow.evaluation_repository.get_reaction_by_id(
                reaction_id
            )

            if not reaction:
                return None

            return self._to_response_reaction(reaction)

    async def get_evaluation_reactions_by_form_id(
        self, form_id: str
    ) -> list[EvaluationReactionResponse]:
        async with self.uow as uow:
            reactions = (
                await uow.evaluation_repository.get_reactions_by_evaluation_form_id(
                    form_id
                )
            )

            return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_all_evaluation_reactions(
        self,
    ) -> list[EvaluationReactionResponse]:
        async with self.uow as uow:
            reactions = await uow.evaluation_repository.get_all_reactions()

            return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_evaluation_reactions_by_type(
        self, reaction_type: ReactionType
    ) -> list[EvaluationReactionResponse]:
        async with self.uow as uow:
            reactions = await uow.evaluation_repository.get_reactions_by_type(
                reaction_type.value
            )

            return [self._to_response_reaction(reaction) for reaction in reactions]

    async def get_evaluation_reaction_by_form_and_user(
        self, form_id: str, user_id: str
    ) -> EvaluationReactionResponse | None:
        async with self.uow as uow:
            reaction = (
                await uow.evaluation_repository.get_reaction_by_form_and_user(
                    form_id,
                    user_id,
                )
            )

            if not reaction:
                return None

            return self._to_response_reaction(reaction)

    async def get_evaluation_comment_by_id(
        self, comment_id: str
    ) -> EvaluationCommentResponse | None:
        async with self.uow as uow:
            comment = await uow.evaluation_repository.get_comment_by_id(comment_id)

            if not comment:
                return None

            return self._to_response_comment(comment)

    async def get_evaluation_comments_by_form_id(
        self, form_id: str
    ) -> list[EvaluationCommentResponse]:
        async with self.uow as uow:
            comments = (
                await uow.evaluation_repository.get_comments_by_evaluation_form_id(
                    form_id
                )
            )

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
