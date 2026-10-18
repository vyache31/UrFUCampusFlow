from application.services.role_service import RoleService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.role_uow import SqlAlchemyRoleUoW


def get_role_service() -> RoleService:
    return RoleService(SqlAlchemyRoleUoW(SessionLocal))
