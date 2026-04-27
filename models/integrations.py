from sqlalchemy import (
    String, ForeignKey, DateTime
)
from datetime import datetime
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class MicrosoftOAuth(Base):
    __tablename__ = 'microsoft_oauth'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    provider_user_id: Mapped[str] = mapped_column(String(36))
    microsoft_email: Mapped[str] = mapped_column(nullable=True)
    encrypted_refresh_token: Mapped[str]
    encrypted_access_token: Mapped[str]
    access_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scope: Mapped[str]
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_refreshed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool]

    user = relationship('Users', back_populates='microsoft_oauth')


class Meetings(Base):
    __tablename__ = 'meetings'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    team_case_history_id: Mapped[str] = mapped_column(ForeignKey('team_case_history.id'))
    title: Mapped[str]
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    outlook_event_id: Mapped[str]
    event_link: Mapped[str]
    notes: Mapped[str]

    team_case_history = relationship('TeamCaseHistory', back_populates='meetings')
