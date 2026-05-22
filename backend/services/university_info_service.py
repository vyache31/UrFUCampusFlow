from models import Universities
from schemas.university import UniversityCreate, UniversityUpdate
from repositories.university_info_repository import UniversityInfoRepository


class UniversityInfoService:

    def __init__(self, rep: UniversityInfoRepository):
        self.rep = rep

    async def create_university(self, schema: UniversityCreate) -> Universities:
        university = Universities(
            uni_name=schema.uni_name,
            contact_email=schema.contact_email
        )

        return await self.rep.create(university)


    async def update_university(self, uni_id: int, schema: UniversityUpdate) -> Universities | None:
        university = await self.rep.get_by_id(uni_id)
        if not university:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(university, key, value)

        return await self.rep.update(university)


    async def delete_university(self, uni_id: int) -> bool:
        university = await self.rep.get_by_id(uni_id)

        if not university:
            return None

        await self.rep.delete(university)
        return True


    async def get_university_by_id(self, uni_id: int) -> Universities | None:
        return await self.rep.get_by_id(uni_id)


    async def get_all_universities(self, limit: int = 10) -> list[Universities]:

        return await self.rep.get_all(limit=limit)

