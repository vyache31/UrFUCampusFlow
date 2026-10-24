from infrastructure.integrations.ai.case_ai_client import AIClient
from infrastructure.integrations.ai.promts import CASE_GENERATION_PROMPT
from config import settings
from presentation.api.schemas.ai_case_schemas import AIGeneratedCaseResponse


class AIService:
    def __init__(self, client: AIClient):
        self.client = client


    @staticmethod
    def _build_headers() -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}"
        }


    @staticmethod
    def _build_payload(topic: str) -> dict:
        return {
            'model': f'{settings.AI_MODEL}',
            "messages": [
                {"role": "system", "content": CASE_GENERATION_PROMPT},
                {"role": "user", "content": topic},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "generated_case",
                    "strict": True,
                    "schema": AIGeneratedCaseResponse.model_json_schema(),
                },
            },
        }


    async def generate_case(self, topic: str) -> AIGeneratedCaseResponse:
        headers = self._build_headers()
        payload = self._build_payload(topic)

        model_response = await self.client.begin_generation(
            headers=headers,
            payload=payload
        )

        return self.to_response(model_response)


    @staticmethod
    def to_response(model_reponse: dict) -> AIGeneratedCaseResponse:

        ai_answer = model_reponse['choices'][0]['message']['content']

        return AIGeneratedCaseResponse.model_validate_json(ai_answer)
