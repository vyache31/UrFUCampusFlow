from sqlalchemy import CheckConstraint, Index, String, ForeignKey, DateTime, UniqueConstraint
from infrastructure.db.database import Base
from sqlalchemy.orm import relationship, mapped_column, Mapped
from datetime import datetime


class AIChats(Base):
    __tablename__ = 'ai_chats'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, nullable=False, unique=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    title: Mapped[str]
    summary: Mapped[str | None] = mapped_column(nullable=True)
    summarized_through_position: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages = relationship(
        'AIMessages', back_populates='chat',
        cascade='all, delete-orphan', passive_deletes=True
    )
    user = relationship('Users', back_populates='chats')

    __table_args__ = (
        CheckConstraint(
            'summarized_through_position >= 0', name='cc_summarized_through_position'
        ),
    )

class AIMessages(Base):
    __tablename__ = 'ai_messages'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, nullable=False, unique=True)
    chat_id: Mapped[str] = mapped_column(ForeignKey('ai_chats.id', ondelete='CASCADE'))
    position: Mapped[int] = mapped_column(nullable=False)
    role: Mapped[str]
    content: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    chat = relationship('AIChats', back_populates='messages')

    __table_args__ = (
            UniqueConstraint(
                "chat_id", "position", name="uq_chat_id_position"
            ),

            CheckConstraint(
                'position > 0', name='cc_position'
            ),

            CheckConstraint(
                "role in ('user', 'assistant')", name='cc_role'
            )
        )

Index("idx_user_id_updated_at", AIChats.user_id, AIChats.updated_at)
