import logging
from typing import Dict, Any, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

def call_gemini_or_grounded(
    prompt: str,
    system_instruction: str,
    grounded_fallback: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes actual Google Gemini reasoning via google-genai SDK if GEMINI_API_KEY is configured.
    If the API key is absent or external API call fails, seamlessly returns the evidence-grounded
    deterministic analysis, explicitly labeled as DETERMINISTIC_GROUNDED in the run metadata.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        grounded_fallback["analysis_mode"] = "DETERMINISTIC_GROUNDED"
        return grounded_fallback

    try:
        from google import genai
        from google.genai import types
        import json

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        if response.text:
            parsed = json.loads(response.text)
            parsed["analysis_mode"] = "GEMINI_2_5_FLASH"
            return parsed
    except Exception as e:
        logger.warning(f"Gemini API call failed, falling back to deterministic reasoning: {str(e)}")

    grounded_fallback["analysis_mode"] = "DETERMINISTIC_GROUNDED"
    return grounded_fallback
