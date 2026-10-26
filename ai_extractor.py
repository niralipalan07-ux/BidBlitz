import os
import json

from dotenv import load_dotenv
from google import genai

from document_processor import extract_pdf


# Load API key from .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")


# Connect to Gemini
client = genai.Client(api_key=api_key)


def extract_requirements_with_ai(pages):
    """
    Extract tender requirements using Gemini AI.

    Returns a list of requirements.

    Raises a helpful error if Gemini is unavailable.
    """

    all_requirements = []

    for page in pages:

        # Skip pages that contain no selectable text
        if not page["text"].strip():
            print(f"Skipping empty page {page['page']}")
            continue

        prompt = f"""
You are an AI assistant that extracts requirements
from government tender documents.

Identify all technical and eligibility requirements.

Return ONLY a JSON array.

Each item must contain:
- requirement: short requirement name
- value: required value or condition

Do not invent requirements.

Tender text:
{page["text"]}
"""

        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )

            if not response.text:
                raise ValueError("Gemini returned an empty response.")

            requirements = json.loads(response.text)

            if not isinstance(requirements, list):
                raise ValueError("Gemini did not return a JSON list.")

            for item in requirements:

                if not isinstance(item, dict):
                    raise ValueError("Invalid requirement format.")

                if "requirement" not in item or "value" not in item:
                    raise ValueError("Missing requirement or value.")

                all_requirements.append({
                    "requirement": str(item["requirement"]),
                    "value": str(item["value"]),
                    "page": page["page"],
                    "filename": page["filename"]
                })

        except Exception as error:
            raise RuntimeError(
                f"AI extraction failed on page {page['page']}: {error}"
            ) from error

    return all_requirements


def process_tender_with_ai(pdf_input, filename=None):
    """
    Process a tender PDF and extract requirements using Gemini AI.

    Accepts:
    - Local PDF file path
    - Streamlit uploaded PDF

    Returns:
    - List of structured tender requirements
    """

    # Step 1: Extract text from the PDF
    pages = extract_pdf(pdf_input, filename)

    # Step 2: Extract requirements using Gemini AI
    requirements = extract_requirements_with_ai(pages)

    # Step 3: Return the structured requirements
    return requirements

if __name__ == "__main__":

    # Read sample tender
    pages = extract_pdf("sample_tender.pdf")

    # Extract requirements using Gemini
    results = extract_requirements_with_ai(pages)

    print("\n========== AI EXTRACTED REQUIREMENTS ==========\n")

    for item in results:
        print(item)

    with open("ai_tender_requirements.json", "w", encoding="utf-8") as file:
        json.dump(results, file, indent=4, ensure_ascii=False)

    print("\nAI requirements saved successfully!")