# SAVE TEST
from io import BytesIO

import cv2
import numpy as np
from pathlib import Path
import sys

import pymupdf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from document_processor import extract_pdf_bytes
from compliance_engine import run_compliance_checks
from report_generator import create_pdf_report

# Load the image-forensics modules from src/lib
LIB_PATH = Path(__file__).resolve().parent / "src" / "lib"
sys.path.insert(0, str(LIB_PATH))
<<<<<<< HEAD
=======

from image_forensics.watermark import analyze_watermark


WATERMARK_REFERENCE_PATH = (
    Path(__file__).resolve().parent
    / "src" / "lib" / "test_images"
    / "watermark_reference.png"
)


def check_pdf_watermark(pdf_bytes):
    """Compare every PDF page against the fixed reference watermark."""
    if not WATERMARK_REFERENCE_PATH.exists():
        raise RuntimeError(
            f"Watermark reference not found: {WATERMARK_REFERENCE_PATH}"
        )

    reference = cv2.imread(str(WATERMARK_REFERENCE_PATH))
    if reference is None:
        raise RuntimeError("Could not load the watermark reference image.")

    results = []

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as pdf:
        for page_number, page in enumerate(pdf, start=1):
            pix = page.get_pixmap(dpi=150, alpha=False)

            image = np.frombuffer(
                pix.samples, dtype=np.uint8
            ).reshape(pix.height, pix.width, pix.n)

            page_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            check = analyze_watermark(page_image, reference)

            status_map = {
                "ok": "MATCHED",
                "review": "REVIEW",
                "low_quality": "REVIEW",
                "not_checked": "REVIEW",
            }

            results.append({
                "page": page_number,
                "status": status_map.get(check["status"], "REVIEW"),
                "evidence": (
                    f"Matching features: {check['inliers']}"
                    if check.get("inliers") is not None
                    else "No matching score available."
                ),
                "reason": check["explanation"],
                "region": check.get("region"),
            })

    return results


>>>>>>> 315f7ae (BidBlitz Project)

from image_forensics.watermark import analyze_watermark


WATERMARK_REFERENCE_PATH = (
    Path(__file__).resolve().parent
    / "src" / "lib" / "test_images"
    / "watermark_reference.png"
)


def check_pdf_watermark(pdf_bytes):
    """Compare every PDF page against the fixed reference watermark."""
    if not WATERMARK_REFERENCE_PATH.exists():
        raise RuntimeError(
            f"Watermark reference not found: {WATERMARK_REFERENCE_PATH}"
        )

    reference = cv2.imread(str(WATERMARK_REFERENCE_PATH))
    if reference is None:
        raise RuntimeError("Could not load the watermark reference image.")

    results = []

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as pdf:
        for page_number, page in enumerate(pdf, start=1):
            pix = page.get_pixmap(dpi=150, alpha=False)

            image = np.frombuffer(
                pix.samples, dtype=np.uint8
            ).reshape(pix.height, pix.width, pix.n)

            page_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            check = analyze_watermark(page_image, reference)

            status_map = {
                "ok": "MATCHED",
                "review": "REVIEW",
                "low_quality": "REVIEW",
                "not_checked": "REVIEW",
            }

            results.append({
                "page": page_number,
                "status": status_map.get(check["status"], "REVIEW"),
                "evidence": (
                    f"Matching features: {check['inliers']}"
                    if check.get("inliers") is not None
                    else "No matching score available."
                ),
                "reason": check["explanation"],
                "region": check.get("region"),
            })

    return results



app = FastAPI(title="TenderLens Compliance API")

# Allow local dev and the deployed Lovable frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://tender-sage-lens.lovable.app",
        "https://*.lovable.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
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

        
        vendor_results = run_compliance_checks(
            tender_pages, vendor_pages, vendor.filename
        )
        all_results.extend(vendor_results)

        watermark_pages = check_pdf_watermark(vendor_bytes)

        for item in watermark_pages:
            all_results.append({
                "vendor": vendor.filename,
                "requirement": "Watermark consistency",
                "status": item["status"],
                "evidence": item["evidence"],
                "reason": (
                    f"Page {item['page']}: {item['reason']} "
                    "Reference matching is a screening aid, not proof of authenticity."
                ),
                "page": item["page"],
                "region": item["region"],
            })

    return {
        "tender_name": tender.filename,
        "results": all_results
    }


@app.post("/api/report")


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
