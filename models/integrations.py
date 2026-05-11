from sqlalchemy import (
    String, ForeignKey, DateTime
)
from datetime import datetime, timezone as TZ, timedelta
from typing import Optional
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class MicrosoftOAuth(Base):
    __tablename__ = 'microsoft_oauth'

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    provider_user_id: Mapped[str] = mapped_column(String(36))
    microsoft_email: Mapped[str] = mapped_column(nullable=True)
    encrypted_refresh_token: Mapped[str] = mapped_column(String)
    encrypted_access_token: Mapped[str] = mapped_column(String)
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
    team_case_history_id: Mapped[Optional[str]] = mapped_column(ForeignKey('team_case_history.id'), nullable=True)  # TODO: убрать nullable как только team_case_history_id будет готов
    title: Mapped[str]
    location: Mapped[Optional[str]] = mapped_column(nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    outlook_event_id: Mapped[str]
    event_link: Mapped[str]
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)
    timezone: Mapped[Optional[int]] = mapped_column(nullable=True)

    @property
    def tz(self) -> TZ:
        if self.timezone is None:
            return TZ(timedelta(hours=5))
        return TZ(timedelta(hours=self.timezone))

    team_case_history = relationship('TeamCaseHistory', back_populates='meetings')
