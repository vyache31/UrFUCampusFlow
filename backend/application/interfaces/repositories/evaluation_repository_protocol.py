from typing import Protocol

from infrastructure.db.models import (
    EvaluationForm,
    EvaluationFormComments,
    EvaluationFormReactions,
)


class EvaluationRepositoryProtocol(Protocol):
    async def create_reaction(
        self, reaction: EvaluationFormReactions
    ) -> EvaluationFormReactions:
        ...

    async def get_reaction_by_id(
        self, reaction_id: str
    ) -> EvaluationFormReactions | None:
        ...

    async def get_reactions_by_evaluation_form_id(
        self, form_id: str
    ) -> list[EvaluationFormReactions]:
        ...

    async def get_all_reactions(self) -> list[EvaluationFormReactions]:
        ...

    async def get_reactions_by_type(
        self, reaction_type: str
    ) -> list[EvaluationFormReactions]:
        ...

    async def update_reaction(
        self, reaction: EvaluationFormReactions
    ) -> EvaluationFormReactions | None:
        ...

    async def get_reaction_by_form_and_user(
        self, form_id: str, user_id: str
    ) -> EvaluationFormReactions | None:
        ...

    async def create_form(self, form: EvaluationForm) -> EvaluationForm:
        ...

    async def get_form_by_id(self, form_id: str) -> EvaluationForm | None:
        ...

    async def get_forms_by_case_id(self, case_id: str) -> list[EvaluationForm]:
        ...

    async def get_current_form_by_case_id(
        self, case_id: str
    ) -> EvaluationForm | None:
        ...

    async def create_comment(
        self, comment: EvaluationFormComments
    ) -> EvaluationFormComments:
        ...

    async def get_comment_by_id(
        self, comment_id: str
    ) -> EvaluationFormComments | None:
        ...

    async def get_comments_by_evaluation_form_id(
        self, form_id: str
    ) -> list[EvaluationFormComments]:
        ...

    async def update_comment(
        self, comment: EvaluationFormComments
    ) -> EvaluationFormComments | None:
        ...
