from collections.abc import Sequence

from application.interfaces.uow.university_info_uow_protocol import UniversityInfoUoWProtocol
from infrastructure.db.models import Universities
from presentation.api.schemas.university import UniversityCreate, UniversityUpdate


class UniversityInfoService:

    def __init__(self, uow: UniversityInfoUoWProtocol):
        self.uow = uow

    async def create_university(self, schema: UniversityCreate) -> Universities:
        university = Universities(
            uni_name=schema.uni_name,
            contact_email=schema.contact_email
        )

        async with self.uow as uow:
            university = await uow.university_info_repository.create(university)
            await uow.commit()
            return university


    async def update_university(self, uni_id: int, schema: UniversityUpdate) -> Universities | None:
        async with self.uow as uow:
            university = await uow.university_info_repository.get_by_id(uni_id)
            if not university:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(university, key, value)

            university = await uow.university_info_repository.update(university)
            await uow.commit()
            return university


    async def delete_university(self, uni_id: int) -> bool:
        async with self.uow as uow:
            university = await uow.university_info_repository.get_by_id(uni_id)
            if not university:
                return False

            await uow.university_info_repository.delete(university)
            await uow.commit()
            return True


    async def get_university_by_id(self, uni_id: int) -> Universities | None:
        async with self.uow as uow:
            return await uow.university_info_repository.get_by_id(uni_id)


    async def get_all_universities(self, limit: int = 10) -> Sequence[Universities]:
        async with self.uow as uow:
            return await uow.university_info_repository.get_all(limit=limit)

