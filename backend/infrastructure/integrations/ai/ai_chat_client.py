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
)


class AIClient:
    def __init__(self, httpx_client: httpx.AsyncClient) -> None:
        self.httpx_client = httpx_client

    def estimate_reply_input_tokens(self, messages: Sequence[AIMessage]) -> int:
        encoding = tiktoken.encoding_for_model(settings.AI_MODEL.removeprefix('openai/'))
        context: list[AIMessage] = [
            {"role": "system", "content": promts.SYSTEM_CHAT_BOT_PROMT},
            *messages,
        ]
        text_tokens = sum(
            len(encoding.encode_ordinary(message['role']))
            + len(encoding.encode_ordinary(message['content']))
            for message in context
        )
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

    async def generate_reply(self, messages: Sequence[AIMessage]) -> AIAssistantMessage:
        content = self._build_payload(
            prompt=promts.SYSTEM_CHAT_BOT_PROMT,
            messages=messages,
        )

        response = await self._get_response(content=content)

        return response

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
