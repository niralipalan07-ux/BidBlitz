
import pymupdf


def extract_pdf_bytes(file_bytes, filename):
    """Extract text from each PDF page and retain its source."""
    pages = []

    with pymupdf.open(stream=file_bytes, filetype="pdf") as pdf:
        for page_number, page in enumerate(pdf, start=1):
            pages.append({
                "filename": filename,
                "page": page_number,
                "text": page.get_text("text").strip()
            })

    return pages

