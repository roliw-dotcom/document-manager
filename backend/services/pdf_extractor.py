import io

import pdfplumber


def extract_text(file_bytes: bytes) -> str:
    """Extract all text from a PDF, joining pages with double newlines.

    Returns an empty string if no text could be extracted (e.g. scanned image PDF).
    OCR support can be added later via pdfplumber + pytesseract.
    """
    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text and text.strip():
                pages.append(text.strip())
    return "\n\n".join(pages)
