
from report_generator import create_pdf_report

sample_results = [
    {
        "vendor": "vendor_a.pdf",
        "requirement": "Minimum RAM",
        "status": "MATCHED",
        "evidence": "16 GB RAM",
        "reason": "Required 16 GB; vendor states 16 GB.",
        "page": "vendor_a.pdf, page 1"
    },
    {
        "vendor": "vendor_a.pdf",
        "requirement": "Company experience",
        "status": "NOT MET",
        "evidence": "3 years of experience",
        "reason": "Required 5 years; vendor states 3 years.",
        "page": "vendor_a.pdf, page 2"
    }
]

pdf_bytes = create_pdf_report(
    sample_results,
    "sample_tender.pdf"
)

with open("test_report.pdf", "wb") as file:
    file.write(pdf_bytes)

print("PDF report created successfully!")
