
import re


def combined_text(pages):
    """Combine extracted text while keeping page references."""
    return "\n".join(
        f"[Source: {p.get('filename', 'unknown')}, "
        f"Page {p.get('page', '?')}]\n{p.get('text', '')}"
        for p in pages
    )


def find_ram(text):
    """Find RAM values such as 16 GB RAM or RAM: 16GB."""
    pattern = r"(\d+(?:\.\d+)?)\s*(?:GB|gigabytes?)\s*(?:of\s*)?RAM|RAM\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:GB|gigabytes?)"

    for match in re.finditer(pattern, text, re.IGNORECASE):
        value = next(
            (group for group in match.groups() if group is not None),
            None
        )
        if value is not None:
            return float(value), match.group(0)

    return None, None


def find_experience(text):
    """Find years of company experience."""
    patterns = [
        r"(?:minimum|min\.?|at least)\s*(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:company\s*)?experience",
        r"(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:company\s*)?experience",
        r"experience\s*(?:of|:)?\s*(\d+)\s*\+?\s*years?"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1)), match.group(0)

    return None, None


def find_source(pages, phrase):
    """Find the page containing a piece of evidence."""
    if not phrase:
        return "Not found"

    for page in pages:
        text = page.get("text", "")
        if phrase.lower() in text.lower():
            return (
                f"{page.get('filename', 'unknown')}, "
                f"page {page.get('page', '?')}"
            )

    return "Source page not identified"


def check_ram(tender_pages, vendor_pages, vendor_name):
    tender_text = combined_text(tender_pages)
    vendor_text = combined_text(vendor_pages)

    # Only compare RAM if the tender actually specifies a RAM requirement.
    if not re.search(r"\bRAM\b", tender_text, re.IGNORECASE):
        return {
            "vendor": vendor_name,
            "requirement": "RAM",
            "status": "REVIEW",
            "evidence": "No RAM requirement identified in tender",
            "reason": "Check the tender wording manually.",
            "page": "Not found"
        }

    required_ram, tender_evidence = find_ram(tender_text)
    vendor_ram, vendor_evidence = find_ram(vendor_text)

    if required_ram is None:
        status = "REVIEW"
        reason = "Could not identify the required RAM value."
        evidence = tender_evidence or "Requirement value not identified"
        page = find_source(tender_pages, evidence)
    elif vendor_ram is None:
        status = "REVIEW"
        reason = "Vendor RAM value was not identified in its documents."
        evidence = tender_evidence
        page = find_source(tender_pages, evidence)
    else:
        status = "MATCHED" if vendor_ram >= required_ram else "NOT MET"
        reason = (
            f"Required: {required_ram:g} GB; "
            f"vendor evidence indicates {vendor_ram:g} GB."
        )
        evidence = vendor_evidence
        page = find_source(vendor_pages, evidence)

    return {
        "vendor": vendor_name,
        "requirement": "Minimum RAM",
        "status": status,
        "evidence": evidence or "No evidence found",
        "reason": reason,
        "page": page
    }


def check_experience(tender_pages, vendor_pages, vendor_name):
    tender_text = combined_text(tender_pages)
    vendor_text = combined_text(vendor_pages)

    if not re.search(r"experience", tender_text, re.IGNORECASE):
        return {
            "vendor": vendor_name,
            "requirement": "Company experience",
            "status": "REVIEW",
            "evidence": "No experience requirement identified",
            "reason": "Check whether experience is mandatory in the tender.",
            "page": "Not found"
        }

    required, tender_evidence = find_experience(tender_text)
    actual, vendor_evidence = find_experience(vendor_text)

    if required is None:
        status = "REVIEW"
        evidence = tender_evidence or "Requirement value not identified"
        reason = "Could not identify the required years of experience."
        page = find_source(tender_pages, evidence)
    elif actual is None:
        status = "REVIEW"
        evidence = "Vendor experience not identified"
        reason = "Check the vendor's supporting documents manually."
        page = "Not found"
    else:
        status = "MATCHED" if actual >= required else "NOT MET"
        evidence = vendor_evidence
        reason = f"Required: {required} years; vendor states {actual} years."
        page = find_source(vendor_pages, evidence)

    return {
        "vendor": vendor_name,
        "requirement": "Company experience",
        "status": status,
        "evidence": evidence,
        "reason": reason,
        "page": page
    }


def check_oem_authorization(tender_pages, vendor_pages, vendor_name):
    tender_text = combined_text(tender_pages)
    vendor_text = combined_text(vendor_pages)

    required = re.search(
        r"OEM.{0,40}(?:authori[sz]ation|certificate|letter)|"
        r"(?:authori[sz]ation|certificate|letter).{0,40}OEM",
        tender_text,
        re.IGNORECASE
    )

    if not required:
        return {
            "vendor": vendor_name,
            "requirement": "OEM authorization",
            "status": "REVIEW",
            "evidence": "Requirement not clearly identified",
            "reason": "Confirm whether OEM authorization is required.",
            "page": "Not found"
        }

    evidence_pattern = (
        r"OEM.{0,60}(?:authori[sz]ation|certificate|letter)|"
        r"(?:authori[sz]ation|certificate|letter).{0,60}OEM"
    )
    evidence_match = re.search(
        evidence_pattern, vendor_text, re.IGNORECASE
    )

    if evidence_match:
        evidence = evidence_match.group(0)
        status = "REVIEW"
        reason = (
            "Related text was found. Verify the actual authorization "
            "document, issuer, signature, and validity manually."
        )
        page = find_source(vendor_pages, evidence)
    else:
        evidence = "No matching authorization text identified"
        status = "REVIEW"
        reason = (
            "Authorization evidence was not identified. "
            "Check the submitted documents manually."
        )
        page = "Not found"

    return {
        "vendor": vendor_name,
        "requirement": "OEM authorization",
        "status": status,
        "evidence": evidence,
        "reason": reason,
        "page": page
    }


def run_compliance_checks(tender_pages, vendor_pages, vendor_name=None):
    vendor_name = vendor_name or (
        vendor_pages[0].get("filename", "Vendor")
        if vendor_pages else "Vendor"
    )
    """Return one result dictionary per check."""
    return [
        check_ram(tender_pages, vendor_pages, vendor_name),
        check_experience(tender_pages, vendor_pages, vendor_name),
        check_oem_authorization(tender_pages, vendor_pages, vendor_name)
    ]
