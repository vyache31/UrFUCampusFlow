from application.services.university_info_service import UniversityInfoService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.university_info_uow import SqlAlchemyUniversityInfoUoW


def get_university_service() -> UniversityInfoService:
    return UniversityInfoService(SqlAlchemyUniversityInfoUoW(SessionLocal))
