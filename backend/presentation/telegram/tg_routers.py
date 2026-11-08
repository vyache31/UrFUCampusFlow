from datetime import date, datetime, timedelta
from json import JSONDecodeError
import logging
from zoneinfo import ZoneInfo
from secrets import token_hex

import httpx

from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery, ErrorEvent, InlineKeyboardButton
from aiogram.filters import CommandStart
from aiogram.filters.exception import ExceptionTypeFilter
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage

from config import settings
from infrastructure.integrations.backend_api import BackendAPI
from infrastructure.integrations.exceptions import BackendResponseError
from application.services.const import interview_settings

api = BackendAPI(settings.BACKEND_URL)

bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
router = Router()
EKATERINBURG_TZ = ZoneInfo(interview_settings.INTERVIEW_TIMEZONE)
logger = logging.getLogger(__name__)


@router.error(ExceptionTypeFilter(httpx.HTTPError, BackendResponseError))
async def handle_backend_error(event: ErrorEvent):
    error = event.exception
    text = "Не удалось получить ответ сервера. Попробуйте позже."
    callback = event.update.callback_query
    if callback and callback.data and callback.data.startswith("confirm_interview:"):
        text = "Не удалось подтвердить результат записи. Уточните у куратора, создана ли запись, прежде чем повторять её."
    if isinstance(error, httpx.HTTPStatusError) and 400 <= error.response.status_code < 500:
        try:
            body = error.response.json()
        except JSONDecodeError:
            body = None
        detail = body.get("detail") if isinstance(body, dict) else None
        if isinstance(detail, str):
            text = detail
    logger.warning("Bot backend request failed: %s", type(error).__name__)
    if callback:
        if callback.message:
            await callback.message.answer(text)
    elif event.update.message:
        await event.update.message.answer(text)
    return True

class InterviewState(StatesGroup):
    waiting_for_team_name = State()
    waiting_for_day = State()
    waiting_for_slot = State()
    waiting_for_confirmation = State()

CASE_CACHE: dict[str, dict] = {}

def main_menu():
    kb = InlineKeyboardBuilder()
    kb.button(
        text="Узнать об актуальных кейсах",
        callback_data="get_cases"
    )
    return kb.as_markup()


@router.message(CommandStart())
async def start(message: Message, state: FSMContext):
    await state.clear()
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
        print(f"LOG: in get_cases id = {case_id}")

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
    print(f"LOG: in view_case case_id = {case_id}")
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
    await callback.answer()
    case_id = callback.data.split("_")[1]

    await state.clear()
    await state.update_data(case_id=case_id)
    await state.set_state(InterviewState.waiting_for_team_name)

    await callback.message.edit_text(
        "Введите название команды:"
    )

@router.message(InterviewState.waiting_for_team_name)
async def process_team_name(message: Message, state: FSMContext):
    if not message.text or not message.text.strip():
        await message.answer("Отправьте название команды текстом.")
        return

    await state.update_data(team_name=message.text.strip())
    await show_interview_days(message, state)


async def current_selection(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    if callback.data.split(":")[1] != data.get("selection_id"):
        await callback.answer("Эта кнопка устарела. Используйте последнее сообщение.")
        return None
    await callback.answer()
    return data


async def show_interview_days(message: Message, state: FSMContext):
    selection_id = token_hex(4)
    today = datetime.now(EKATERINBURG_TZ).date()
    kb = InlineKeyboardBuilder()
    for offset in range(14):
        day = today + timedelta(days=offset)
        kb.button(
            text=day.strftime("%d.%m"),
            callback_data=f"day:{selection_id}:{day.isoformat()}",
        )
    kb.adjust(3)
    kb.row(InlineKeyboardButton(text="Отмена", callback_data=f"cancel_interview:{selection_id}"))
    await state.update_data(selection_id=selection_id)
    await state.set_state(InterviewState.waiting_for_day)
    await message.answer(
        "Выберите день интервью. Время указано по Екатеринбургу (UTC+5).",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(InterviewState.waiting_for_day, F.data.startswith("day:"))
async def select_interview_day(callback: CallbackQuery, state: FSMContext):
    data = await current_selection(callback, state)
    if data is None:
        return
    day = date.fromisoformat(callback.data.split(":")[2])
    slots = await api.get_interview_slots(day)
    if not slots:
        await callback.message.answer("На этот день свободного времени нет. Выберите другой день.")
        return
    selection_id = token_hex(4)
    kb = InlineKeyboardBuilder()
    for index, slot in enumerate(slots):
        start_at = slot.start_at.astimezone(EKATERINBURG_TZ)
        end_at = slot.end_at.astimezone(EKATERINBURG_TZ)
        kb.button(
            text=f"{start_at:%H:%M}–{end_at:%H:%M}",
            callback_data=f"slot:{selection_id}:{index}",
        )
    kb.adjust(3)
    kb.row(
        InlineKeyboardButton(text="Другой день", callback_data=f"days:{selection_id}"),
        InlineKeyboardButton(text="Отмена", callback_data=f"cancel_interview:{selection_id}"),
    )
    await state.update_data(
        slots=[slot.model_dump(mode="json") for slot in slots],
        selection_id=selection_id,
    )
    await state.set_state(InterviewState.waiting_for_slot)
    await callback.message.edit_text(
        f"Свободное время на {day:%d.%m.%Y} (Екатеринбург, UTC+5):",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(InterviewState.waiting_for_slot, F.data.startswith("slot:"))
async def select_interview_slot(callback: CallbackQuery, state: FSMContext):
    data = await current_selection(callback, state)
    if data is None:
        return
    index = callback.data.split(":")[2]
    if not index.isdecimal() or int(index) >= len(data["slots"]):
        await callback.message.answer("Не удалось выбрать время. Используйте кнопки списка.")
        return
    slot = data["slots"][int(index)]
    start_at = datetime.fromisoformat(slot["start_at"]).astimezone(EKATERINBURG_TZ)
    if start_at <= datetime.now(EKATERINBURG_TZ):
        await callback.message.answer("Это время уже прошло. Выберите день заново.")
        await show_interview_days(callback.message, state)
        return
    end_at = datetime.fromisoformat(slot["end_at"]).astimezone(EKATERINBURG_TZ)
    selection_id = token_hex(4)
    await state.update_data(
        date_time=slot["start_at"],
        end_at=slot["end_at"],
        curator_user_ids=slot["curator_user_ids"],
        selection_id=selection_id,
    )

    kb = InlineKeyboardBuilder()
    kb.button(
        text="✅ Записаться",
        callback_data=f"confirm_interview:{selection_id}"
    )

    kb.button(
        text="❌ Отмена",
        callback_data=f"cancel_interview:{selection_id}"
    )
    kb.button(text="Другой день", callback_data=f"days:{selection_id}")

    kb.adjust(2)

    await state.set_state(
        InterviewState.waiting_for_confirmation
    )

    await callback.message.edit_text(
        f"Название команды: {data['team_name']}\n"
        f"Дата: {start_at:%d.%m.%Y}\n"
        f"Время: {start_at:%H:%M}–{end_at:%H:%M} (Екатеринбург, UTC+5)\n\n"
        f"Подтвердить запись?",
        reply_markup=kb.as_markup()
    )


@router.callback_query(
    InterviewState.waiting_for_confirmation,
    F.data.startswith("confirm_interview:")
)
async def confirm_interview(
    callback: CallbackQuery,
    state: FSMContext
):
    data = await current_selection(callback, state)
    if data is None:
        return

    if datetime.fromisoformat(data["date_time"]) <= datetime.now(EKATERINBURG_TZ):
        await callback.message.answer("Это время уже прошло. Выберите день заново.")
        await show_interview_days(callback.message, state)
        return

    bot_case = await api.get_bot_case_by_case_id(data["case_id"])
    await api.create_interview(
        tg_user_id=callback.from_user.id,
        case_id=bot_case["id"],
        team_name=data["team_name"],
        date_time=data["date_time"],
    )

    await callback.message.edit_text(
        "✅ Заявка на интервью отправлена. Ожидайте подтверждения куратора."
    )

    await state.clear()


@router.callback_query(InterviewState.waiting_for_slot, F.data.startswith("days:"))
@router.callback_query(InterviewState.waiting_for_confirmation, F.data.startswith("days:"))
async def change_interview_day(callback: CallbackQuery, state: FSMContext):
    if await current_selection(callback, state) is not None:
        await show_interview_days(callback.message, state)


@router.callback_query(F.data.startswith("cancel_interview:"))
async def cancel_interview(
    callback: CallbackQuery,
    state: FSMContext
):
    if await current_selection(callback, state) is None:
        return
    await state.clear()

    await callback.message.edit_text(
        "Запись отменена."
    )


@router.callback_query(F.data.startswith(("curator:", "day:", "slot:", "days:", "confirm_interview:")))
async def expired_interview_button(callback: CallbackQuery):
    await callback.answer("Эта кнопка устарела. Используйте последнее сообщение или начните с /start.")
