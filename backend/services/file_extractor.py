import io
import pdfplumber
from bs4 import BeautifulSoup


def extract_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text.strip())
    return "\n\n".join(text_parts)


def extract_html(file_bytes: bytes) -> str:
    """Extract readable text from an HTML file."""
    soup = BeautifulSoup(file_bytes, "html.parser")
    # Remove script / style tags
    for tag in soup(["script", "style", "head", "meta", "link"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    # Clean up blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def extract_file(filename: str, file_bytes: bytes) -> str:
    """Auto-detect file type and extract text."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_pdf(file_bytes)
    elif lower.endswith(".html") or lower.endswith(".htm"):
        return extract_html(file_bytes)
    else:
        # Try plain text
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""
