import json
from collections.abc import Sequence
from math import ceil

import httpx
import tiktoken
from pydantic import ValidationError

from application.exceptions.ai import AIAssistantMessageValidationError
from config import settings
from infrastructure.integrations.ai import promts
from presentation.api.schemas.ai import (
    AIAssistantMessage,
    AICompletionResponse,
    AIMessage,
    AICaseDraft,
    AIChatGenerationResult,
)


class AIClient:
    def __init__(self, httpx_client: httpx.AsyncClient) -> None:
        self.httpx_client = httpx_client

    def estimate_reply_input_tokens(
        self,
        messages: Sequence[AIMessage],
        current_draft: AICaseDraft | None = None,
    ) -> int:
        encoding = tiktoken.encoding_for_model(settings.AI_MODEL.removeprefix('openai/'))
        context: list[AIMessage] = [
            {"role": "system", "content": promts.SYSTEM_CHAT_BOT_PROMT},
            *self._build_reply_messages(messages, current_draft),
        ]
        text_tokens = sum(
            len(encoding.encode_ordinary(message['role']))
            + len(encoding.encode_ordinary(message['content']))
            for message in context
        )
        text_tokens += len(encoding.encode_ordinary(
            json.dumps(self._reply_response_format(), ensure_ascii=False)
        ))
        # Approximate message framing and reply prefix, with a 10% safety margin.
        return ceil((text_tokens + 8 * len(context) + 3) * 1.1)

    async def _get_response(self, content: dict[str, object]) -> AIAssistantMessage:
        response = await self.httpx_client.post(
            url=settings.GROQ_REQUEST_URL,
            headers=self._build_headers(),
            json=content,
        )

        response.raise_for_status()
        try:
            completion = AICompletionResponse.model_validate_json(response.content)
        except ValidationError as exc:
            raise AIAssistantMessageValidationError(
                'AI provider returned an invalid or incomplete response.'
            ) from exc

        return completion.choices[0].message

    async def generate_reply(
        self,
        messages: Sequence[AIMessage],
        current_draft: AICaseDraft | None = None,
    ) -> AIChatGenerationResult:
        content = self._build_payload(
            prompt=promts.SYSTEM_CHAT_BOT_PROMT,
            messages=self._build_reply_messages(messages, current_draft),
        )
        content['response_format'] = self._reply_response_format()

        response = await self._get_response(content=content)

        try:
            result = AIChatGenerationResult.model_validate_json(response.content)

        except ValidationError as exc:
            raise AIAssistantMessageValidationError(
                'AI provider returned an invalid or incomplete response.'
            ) from exc

        return result

    @staticmethod
    def _reply_response_format() -> dict[str, object]:
        return {
            'type': 'json_schema',
            'json_schema': {
                'name': 'ai_chat_generation',
                'strict': True,
                'schema': AIChatGenerationResult.model_json_schema(),
            },
        }

    @staticmethod
    def _build_reply_messages(
        messages: Sequence[AIMessage],
        current_draft: AICaseDraft | None,
    ) -> list[AIMessage]:
        draft_json = current_draft.model_dump_json() if current_draft is not None else 'null'
        return [
            {'role': 'user', 'content': f'Current case draft: {draft_json}'},
            *messages,
        ]

    @staticmethod
    def _build_headers() -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        }

    @staticmethod
    def _build_payload(
        messages: Sequence[AIMessage],
        prompt: str,
    ) -> dict[str, object]:
        return {
            "model": settings.AI_MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                *messages,
            ],
            "reasoning_effort": settings.REASONING_EFFORT,
            "max_completion_tokens": settings.MAX_COMPLETION_TOKENS,
        }

    async def generate_summary(
        self,
        messages: Sequence[AIMessage],
        summary: str | None = None,
    ) -> str:
        summary_input = json.dumps(
            {"previous_summary": summary, "messages": list(messages)},
            ensure_ascii=False,
        )

        content = self._build_payload(
            prompt=promts.AI_SUMMARY_PROMPT,
            messages=[{"role": "user", "content": summary_input}],
        )

        response = await self._get_response(content)

        return response.content
