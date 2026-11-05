from collections.abc import Sequence
from datetime import datetime
from typing import Protocol

from infrastructure.db.models.bot import BotCases, BotMode, Interviews, RecruitmentCurators


class BotRepositoryProtocol(Protocol):
    async def get_current_mode(self) -> BotMode | None:
        ...

    async def change_current_mode(self) -> None:
        ...

    async def get_all_bot_cases(self) -> Sequence[BotCases]:
        ...

    async def get_bot_case_by_id(self, case_id: str) -> BotCases | None:
        ...

    async def get_bot_case_by_case_id(self, case_id: str) -> BotCases | None:
        ...

    async def add_bot_case(self, bot_case: BotCases) -> BotCases:
        ...

    async def delete_bot_case(self, bot_case: BotCases) -> None:
        ...

    async def get_all_recruitment_curators(self) -> Sequence[RecruitmentCurators]:
        ...

    async def get_recruitment_curator_by_id(
        self, curator_id: str
    ) -> RecruitmentCurators | None:
        ...

    async def add_recruitment_curator(
        self, curator: RecruitmentCurators
    ) -> RecruitmentCurators:
        ...

    async def delete_recruitment_curator(self, curator: RecruitmentCurators) -> None:
        ...

    async def get_all_interviews(self) -> Sequence[Interviews]:
        ...

    async def get_interview_by_id(self, interview_id: str) -> Interviews | None:
        ...

    async def get_interview_by_datetime(self, date_time: datetime) -> Interviews | None:
        ...

    async def add_interview(self, interview: Interviews) -> Interviews:
        ...

    async def delete_interview(self, interview: Interviews) -> None:
        ...
