from integrations.ai.case_ai_client import AIClient
from integrations.ai.promts import TEST_AI_PROMT
from config import settings
from schemas.ai_case_schemas import AIGeneratedCaseResponse


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
    def _build_payload() -> dict:
        return {
            'model': f'{settings.AI_MODEL}',
            "messages": [{
                "role": "user",
                "content": f"{TEST_AI_PROMT}"
            }]
        }


    async def generate_case(self) -> AIGeneratedCaseResponse:
        headers = self._build_headers()
        payload = self._build_payload()

        model_response = await self.client.begin_generation(
            headers=headers,
            payload=payload
        )

        return self.to_response(model_response)


    @staticmethod
    def to_response(model_reponse: dict) -> AIGeneratedCaseResponse:

        ai_answer = model_reponse['choices'][0]['message']['content']

        return AIGeneratedCaseResponse.model_validate_json(ai_answer)
