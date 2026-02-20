import json

import anthropic

from config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

CATEGORIES = [
    "Legal",
    "Finance",
    "Medical",
    "Technical",
    "HR",
    "Academic",
    "Correspondence",
    "Other",
]

# Send only the first N characters — enough context, keeps token cost predictable
_MAX_TEXT_CHARS = 8_000


def categorize_document(extracted_text: str, filename: str) -> dict:
    """Call Claude to assign category, subcategory, summary, and tags.

    Returns a dict with keys: category, subcategory, summary, tags.
    Falls back to safe defaults if the model returns non-JSON.
    """
    snippet = extracted_text[:_MAX_TEXT_CHARS]

    prompt = f"""You are a document classification assistant.
Analyze the document below and return a JSON object with exactly these fields:
- "category": one of {CATEGORIES}
- "subcategory": a specific label within the category (e.g. "Invoice", "Employment Contract", "Lab Report")
- "summary": 2-3 sentences describing what the document is about
- "tags": an array of 3-5 lowercase keyword tags

Filename: {filename}

Document text:
{snippet}

Respond with only the JSON object — no markdown fences, no explanation."""

    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "category": "Other",
            "subcategory": "Unknown",
            "summary": "Automatic categorization could not parse the AI response.",
            "tags": [],
        }
