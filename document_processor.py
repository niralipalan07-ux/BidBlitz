import pymupdf
import json

def extract_pdf(file_input, filename=None):
    """
    Extract text from a PDF.

    Supports:
    1. A PDF file path
    2. A PDF uploaded through Streamlit
    """

    # Check whether the input is an uploaded file
    if hasattr(file_input, "getvalue"):

        pdf_bytes = file_input.getvalue()

        document = pymupdf.open(
            stream=pdf_bytes,
            filetype="pdf"
        )

        pdf_name = filename or getattr(
            file_input, "name", "uploaded.pdf"
        )

    else:

        # Open a PDF stored on the computer
        document = pymupdf.open(file_input)

        pdf_name = filename or str(file_input)

    extracted_pages = []

    try:
        for page_number, page in enumerate(document, start=1):

            text = page.get_text("text")

            extracted_pages.append({
                "filename": pdf_name,
                "page": page_number,
                "text": text
            })

    finally:
        document.close()

    return extracted_pages

def extract_requirements(pages):
    """
    Finds lines containing common tender requirement keywords.
    """

    keywords = [
        "RAM",
        "storage",
        "processor",
        "operating system",
        "experience",
        "GST",
        "OEM",
        "PAN"
    ]

    requirements = []

    for page in pages:
        lines = page["text"].splitlines()

        for line in lines:
            if any(
                keyword.lower() in line.lower()
                for keyword in keywords
            ):
                requirements.append({
                    "requirement": line.strip(),
                    "page": page["page"],
                    "filename": page["filename"]
                })

    return requirements

def structure_requirements(requirements):
    """
    Converts extracted requirement lines into structured data.
    """

    structured_data = []

    for item in requirements:

        line = item["requirement"]

        # Remove numbering like "1." or "2."
        line = line.strip()

        if "." in line:
            first_part, remaining = line.split(".", 1)

            if first_part.strip().isdigit():
                line = remaining.strip()

        # Split requirement name and value
        if ":" in line:
            name, value = line.split(":", 1)

            structured_data.append({
                "requirement": name.strip(),
                "value": value.strip(),
                "page": item["page"],
                "filename": item["filename"]
            })

        else:
            structured_data.append({
                "requirement": line,
                "value": "Required",
                "page": item["page"],
                "filename": item["filename"]
            })

    return structured_data

def save_as_json(data, filename):
    """
    Saves extracted information into a JSON file.
    """

    with open(filename, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    print("Saved successfully:", filename)

if __name__ == "__main__":

    # Read the tender PDF
    tender_pages = extract_pdf("sample_tender.pdf")

    # Read the vendor PDF
    vendor_pages = extract_pdf("sample_vendor.pdf")

    # Extract possible tender requirements
    tender_requirements = extract_requirements(tender_pages)
    structured_requirements = structure_requirements(tender_requirements)

    # Extract possible vendor specifications
    vendor_requirements = extract_requirements(vendor_pages)

    # Convert vendor specifications into structured data
    structured_vendor = structure_requirements(vendor_requirements)

    print("\n========== STRUCTURED VENDOR INFORMATION ==========\n")

    for item in structured_vendor:
        print(item)

    save_as_json(structured_requirements, "tender_data.json")
    save_as_json(structured_vendor, "vendor_data.json")
    print("\n========== STRUCTURED REQUIREMENTS ==========\n")

    for item in structured_requirements:
        print(item)

    print("\n========== TENDER REQUIREMENTS ==========\n")

    for item in tender_requirements:
        print("Requirement:", item["requirement"])
        print("Page:", item["page"])
        print("----------------------------------")

    print("\n========== VENDOR DOCUMENT ==========\n")

    # Display text extracted from the vendor PDF
    for page in vendor_pages:
        print("Page:", page["page"])
        print(page["text"])
        print("----------------------------------")