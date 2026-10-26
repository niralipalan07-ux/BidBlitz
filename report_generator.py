
from io import BytesIO
from html import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)


def create_pdf_report(results, tender_name="Tender document"):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        textColor=colors.grey
    ))

    story = [
        Paragraph("AI Tender Checker", styles["Title"]),
        Paragraph(
            "Vendor Compliance Review Report",
            styles["ReportSubtitle"]
        ),
        Spacer(1, 6 * mm),
        Paragraph(
            f"<b>Tender file:</b> {escape(str(tender_name))}",
            styles["Normal"]
        ),
        Spacer(1, 5 * mm)
    ]

    headers = [
        "Vendor", "Requirement", "Status",
        "Evidence", "Reason", "Source page"
    ]

    data = [[
        Paragraph(f"<b>{h}</b>", styles["Normal"])
        for h in headers
    ]]

    for item in results:
        row = [
            item.get("vendor", ""),
            item.get("requirement", ""),
            item.get("status", ""),
            item.get("evidence", ""),
            item.get("reason", ""),
            item.get("page", "")
        ]

        data.append([
            Paragraph(escape(str(value)), styles["BodyText"])
            for value in row
        ])

    if not results:
        data.append([
            Paragraph("No results available.", styles["BodyText"])
        ] + [
            Paragraph("", styles["BodyText"])
            for _ in range(5)
        ])

    table = Table(
        data,
        colWidths=[35*mm, 36*mm, 25*mm, 48*mm, 65*mm, 30*mm],
        repeatRows=1
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0),
         colors.HexColor("#17365D")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(table)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Disclaimer: This is an automated preliminary review. "
        "It is not an official procurement decision or proof of "
        "document authenticity. Human verification is required.",
        styles["Italic"]
    ))

    doc.build(story)
    buffer.seek(0)

    return buffer.getvalue()
