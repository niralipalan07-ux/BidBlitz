# SAVE TEST
from io import BytesIO

import pymupdf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from document_processor import extract_pdf_bytes
from compliance_engine import run_compliance_checks
from report_generator import create_pdf_report


app = FastAPI(title="BidBlitz API")

# Local development only: allow the Vite frontend to connect.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ReportRequest(BaseModel):
    tender_name: str
    results: list[dict]


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "BidBlitz backend is running"}


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
    if not tender.filename or not tender.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Upload a tender PDF.")

    if not vendors:
        raise HTTPException(400, "Upload at least one vendor PDF.")

    if len(vendors) > 10:
        raise HTTPException(400, "Upload no more than 10 vendor PDFs at once.")

    tender_bytes = await tender.read()

    if not tender_bytes:
        raise HTTPException(400, "The tender file is empty.")

    try:
        tender_pages = extract_pdf_bytes(
            tender_bytes, tender.filename
        )
    except (pymupdf.FileDataError, ValueError):
        raise HTTPException(400, "The tender file could not be read as a PDF.")

    if not any(page["text"] for page in tender_pages):
        raise HTTPException(
            422,
            "No selectable text found in the tender PDF. "
            "It may be scanned and require OCR."
        )

    all_results = []

    for vendor in vendors:
        if not vendor.filename or not vendor.filename.lower().endswith(".pdf"):
            raise HTTPException(400, "Every vendor file must be a PDF.")

        vendor_bytes = await vendor.read()

        if not vendor_bytes:
            raise HTTPException(
                400, f"The file {vendor.filename} is empty."
            )

        try:
            vendor_pages = extract_pdf_bytes(
                vendor_bytes, vendor.filename
            )
        except (pymupdf.FileDataError, ValueError):
            raise HTTPException(
                400, f"The file {vendor.filename} could not be read as a PDF."
            )

        if not any(page["text"] for page in vendor_pages):
            raise HTTPException(
                422,
                f"No selectable text found in {vendor.filename}. "
                "It may be scanned and require OCR."
            )

        # This assumes your existing function accepts three arguments.
        vendor_results = run_compliance_checks(
            tender_pages,
            vendor_pages,
            vendor.filename
        )

        all_results.extend(vendor_results)

    return {
        "tender_name": tender.filename,
        "results": all_results
    }


@app.post("/api/report")
def report(request: ReportRequest):
    try:
        pdf_bytes = create_pdf_report(
            request.results,
            request.tender_name
        )
    except Exception as error:
        # Log the actual error in the backend terminal.
        print(f"Report generation failed: {error}")
        raise HTTPException(
            500, "Could not generate the PDF report."
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="bidblitz_report.pdf"'
        }
    )
