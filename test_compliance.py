
from compliance_engine import run_compliance_checks

tender = [
    {
        "filename": "tender.pdf",
        "page": 1,
        "text": (
            "Minimum RAM: 16 GB RAM. "
            "Minimum 5 years of company experience. "
            "OEM authorization letter required."
        )
    }
]

vendor = [
    {
        "filename": "vendor_a.pdf",
        "page": 1,
        "text": (
            "System RAM: 16 GB RAM. "
            "Company experience: 7 years. "
            "OEM authorization letter attached."
        )
    }
]

results = run_compliance_checks(
    tender,
    vendor,
    "vendor_a.pdf"
)

for result in results:
    print(result["requirement"], "->", result["status"])
    print("Reason:", result["reason"])
    print()
