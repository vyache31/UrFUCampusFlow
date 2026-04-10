from sqlalchemy import (
    String, ForeignKey,
)
from sqlalchemy.orm import relationship, mapped_column, Mapped
from database import Base


class Grades(Base):
    __tablename__ = 'grades'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, unique=True)
    score: Mapped[int]
    team_case_history_id: Mapped[str] = mapped_column(ForeignKey('team_case_history.id'))
    iteration_id: Mapped[int] = mapped_column(ForeignKey('iterations.id'))

    iteration = relationship('Iterations', back_populates='grades')
    team_case_history = relationship('TeamCaseHistory', back_populates='grades')


class Iterations(Base):
    __tablename__ = 'iterations'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    iteration_name: Mapped[str]

    grades = relationship('Grades', back_populates='iteration')