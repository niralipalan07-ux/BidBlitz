
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any
from typing import Annotated
import re

from document_processor import extract_pdf_bytes
from compliance_engine import run_compliance_checks
from report_generator import create_pdf_report

app = FastAPI(title="TenderLens Compliance API")

# Allow the local React/Vite frontend to connect.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "TenderLens API is running"}


async def read_pdf(upload: UploadFile):
    filename = upload.filename or "document.pdf"

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"{filename} is not a PDF file."
        )

    content = await upload.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail=f"{filename} is empty."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"{filename} exceeds the 10 MB limit."
        )

    try:
        return extract_pdf_bytes(content, filename)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read {filename}. Make sure it is a valid PDF."
        ) from exc


def to_frontend_finding(result: dict[str, Any]) -> dict[str, Any]:
    python_status = str(result.get("status", "REVIEW")).upper()

    if python_status == "MATCHED":
        status = "MATCHED"
        action = "No action required. Keep the supporting evidence available."
    elif python_status == "NOT MET":
        # The current frontend type has no NOT_MET status.
        status = "REVIEW_REQUIRED"
        action = (
            "Resolve the requirement gap and provide compliant "
            "supporting evidence."
        )
    else:
        status = "REVIEW_REQUIRED"
        action = "Verify this requirement and its supporting evidence manually."

    page_text = str(result.get("page") or "")
    page_match = re.search(r"\bpage\s*(\d+)\b", page_text, re.IGNORECASE)
    page_number = int(page_match.group(1)) if page_match else None

    return {
        "requirement": result.get("requirement", "Unnamed requirement"),
        "original": result.get("requirement", ""),
        "status": status,
        "evidence": result.get("evidence", "No evidence extracted"),
        "extracted": result.get("evidence", ""),
        "sourceDocument": page_text or None,
        "page": page_number,
        "explanation": result.get("reason", ""),
        "action": action,
    }



@app.post("/api/analyze")
async def analyze(
    tender: UploadFile = File(...),
    vendor1: UploadFile = File(...),
    vendor2: UploadFile | None = File(None),
    vendor3: UploadFile | None = File(None),
):
    vendors = [
        file for file in [vendor1, vendor2, vendor3]
        if file is not None
    ]

    tender_pages = await read_pdf(tender)

    vendor_pages = []
    vendor_names = []

    for vendor_file in vendors:
        pages = await read_pdf(vendor_file)
        vendor_pages.extend(pages)
        if vendor_file.filename:
            vendor_names.append(vendor_file.filename)

    vendor_name = ", ".join(vendor_names) or "Vendor"

    try:
        results = run_compliance_checks(
            tender_pages,
            vendor_pages,
            vendor_name=vendor_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Compliance analysis failed. Check the Python engine."
        ) from exc

    findings = [to_frontend_finding(item) for item in results]

    return {
        "tenderName": tender.filename or "Tender document",
        "vendorName": vendor_name,
        "findings": findings,
        "rawResults": results,
    }



class ReportRequest(BaseModel):
    tender_name: str = "Tender document"
    results: list[dict[str, Any]]


@app.post("/api/report")
def generate_report(request: ReportRequest):
    if not request.results:
        raise HTTPException(
            status_code=400,
            detail="There are no results to include in the report."
        )

    try:
        pdf_bytes = create_pdf_report(
            request.results,
            tender_name=request.tender_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not generate the PDF report."
        ) from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                'attachment; filename="tenderlens_report.pdf"'
        },
    )
