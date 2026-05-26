from datetime import datetime

import httpx

from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder

from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage

from config import settings
from tg_bot.backend_api import BackendAPI


api = BackendAPI(settings.BACKEND_URL)

bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
router = Router()

class InterviewState(StatesGroup):
    waiting_for_datetime = State()

CASE_CACHE: dict[str, dict] = {}

def main_menu():
    kb = InlineKeyboardBuilder()
    kb.button(
        text="Узнать об актуальных кейсах",
        callback_data="get_cases"
    )
    return kb.as_markup()


@router.message(CommandStart())
async def start(message: Message):
    await message.answer(
        f"Добро пожаловать!\n\n"
        f"Здесь ты можешь узнать об актуальных кейсах Альфа банка",
        reply_markup=main_menu()
    )


@router.callback_query(F.data == "get_cases")
async def get_cases(callback: CallbackQuery):
    mode = await api.get_mode()
    if mode.get("mode") == "stop":
        await callback.message.answer(
            "На данный момент интервью не проводятся. Команды набраны."
        )
        return

    cases = await api.get_cases()

    if not cases:
        await callback.message.answer("На данный момент кейсов нет.")
        return

    text = []
    kb = InlineKeyboardBuilder()

    for index, item in enumerate(cases, start=1):

        case_id = item["case_id"]
        case = await api.get_case(case_id)
        CASE_CACHE[case_id] = case

        title = case.get("title", f"Кейс {index}")

        text.append(f"{index}. {title}")

        kb.button(
            text=str(index),
            callback_data=f"view_{case_id}"
        )

    kb.adjust(3)

    await callback.message.answer(
        "\n".join(text),
        reply_markup=kb.as_markup()
    )


@router.callback_query(F.data.startswith("view_"))
async def view_case(callback: CallbackQuery):

    case_id = callback.data.split("_")[1]

    case = CASE_CACHE.get(case_id)

    if not case:
        case = await api.get_case(case_id)
        CASE_CACHE[case_id] = case

    text = (
        f"📌 {case.get('title', 'Без названия')}\n\n"
        f"{case.get('project_goals', 'Описание отсутствует')}"
    )

    kb = InlineKeyboardBuilder()

    kb.button(
        text="⬅ Назад",
        callback_data="get_cases"
    )

    kb.button(
        text="📝 Записаться",
        callback_data=f"apply_{case_id}"
    )

    kb.adjust(2)

    await callback.message.edit_text(
        text,
        reply_markup=kb.as_markup()
    )

@router.callback_query(F.data.startswith("apply_"))
async def apply_case(callback: CallbackQuery, state: FSMContext):

    case_id = callback.data.split("_")[1]

    await state.update_data(case_id=case_id)
    await state.set_state(InterviewState.waiting_for_datetime)

    await callback.message.edit_text(
        "Отправьте дату и время в формате ДД.ММ.ГГГГ ЧЧ:ММ"
    )

@router.message(InterviewState.waiting_for_datetime)
async def process_datetime(message: Message, state: FSMContext):

    try:
        parsed_date = datetime.strptime(
            message.text,
            "%d.%m.%Y %H:%M"
        )
    except ValueError:
        await message.answer("Неверный формат даты.")
        return

    data = await state.get_data()

    try:
        await api.create_interview(
            tg_user_id=message.from_user.id,
            case_id=data["case_id"],
            date_time=parsed_date.isoformat()
        )

    except httpx.HTTPStatusError:
        await message.answer("Данное время занято. Попробуйте другое.")
        return

    await message.answer(
        "Время забронировано. Ссылка на встречу будет отправлена позже."
    )

    await state.clear()
