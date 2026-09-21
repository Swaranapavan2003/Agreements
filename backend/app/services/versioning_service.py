import difflib
from openai import AsyncOpenAI
from app.core.config import settings

class VersioningService:
    def __init__(self):
        self.openai_client = None
        if settings.openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

    def compare_versions(self, text_v1: str, text_v2: str, format: str = "html") -> str:
        """
        Compare two text versions and return a diff.
        format can be 'html' or 'ndiff'.
        """
        if format == "html":
            differ = difflib.HtmlDiff()
            return differ.make_file(text_v1.splitlines(), text_v2.splitlines(), "Version 1", "Version 2")
        else:
            differ = difflib.ndiff(text_v1.splitlines(keepends=True), text_v2.splitlines(keepends=True))
            return "".join(differ)

    async def generate_ai_summary(self, text_v1: str, text_v2: str) -> str:
        """
        Use AI to summarize the differences between two versions of an agreement.
        """
        if not self.openai_client:
            return "AI summarization is disabled. OpenAI API key is missing."

        prompt = (
            "You are an expert legal assistant. Compare the two versions of the agreement provided below.\n"
            "Summarize what changed between Version 1 and Version 2 in clear, concise legal terms.\n\n"
            "--- VERSION 1 ---\n"
            f"{text_v1}\n\n"
            "--- VERSION 2 ---\n"
            f"{text_v2}\n\n"
            "--- END OF TEXT ---\n"
            "Summary of changes:"
        )

        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You summarize legal agreement changes."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error generating summary: {str(e)}"
