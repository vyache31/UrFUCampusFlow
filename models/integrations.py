from sqlalchemy import (
    String, ForeignKey, DateTime
)
from datetime import datetime
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class MicrosoftOAuth(Base):
    __tablename__ = 'microsoft_oauth'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    provider_user_id: Mapped[str] = mapped_column(String(36))
    tenant_id: Mapped[str] = mapped_column(String(36))
    microsoft_email: Mapped[str]
    encrypted_refresh_token: Mapped[str]
    encrypted_access_token: Mapped[str]
    access_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scope: Mapped[str]
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_refreshed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool]


class Meetings(Base):
    __tablename__ = 'meetings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    team_id: Mapped[str] = mapped_column(ForeignKey('teams.id'))
    title: Mapped[str]
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    outlook_event_id: Mapped[str]
    event_link: Mapped[str]
    notes: Mapped[str]