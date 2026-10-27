import cv2
import numpy as np
import pymupdf

TARGET_WIDTH = 1200   # every page is resized to this width so scores are comparable
TILE = 100            # tile size in pixels (after resizing)
GLOBAL_MIN = 60.0     # median sharpness below this = whole scan is poor quality
LOCAL_RATIO = 0.25    # tile sharpness below 25% of the page median = suspicious
MIN_INK = 0.03        # a tile needs 3% dark pixels to count (blank paper is always "blurry")


def _sharpness(gray):
    """Variance of the Laplacian: higher = sharper."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def load_images(file_input):
    """Accept an image path, a PDF path, or a Streamlit upload. Returns [(page_no, BGR image)]."""
    name = getattr(file_input, "name", str(file_input))
    data = file_input.getvalue() if hasattr(file_input, "getvalue") else None

    if name.lower().endswith(".pdf"):
        doc = pymupdf.open(stream=data, filetype="pdf") if data else pymupdf.open(name)
        images = []
        try:
            for i, page in enumerate(doc, start=1):
                pix = page.get_pixmap(dpi=150)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                code = cv2.COLOR_RGBA2BGR if pix.n == 4 else cv2.COLOR_RGB2BGR
                images.append((i, cv2.cvtColor(img, code)))
        finally:
            doc.close()
        return images

    if data is not None:
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    else:
        img = cv2.imread(name)
    if img is None:
        raise ValueError(f"Unsupported or unreadable file: {name}")
    return [(1, img)]


def analyze_blur(img):
    h, w = img.shape[:2]
    scale = TARGET_WIDTH / w
    small = cv2.resize(img, (TARGET_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    tiles = []
    for y in range(0, gray.shape[0] - TILE + 1, TILE):
        for x in range(0, gray.shape[1] - TILE + 1, TILE):
            t = gray[y:y + TILE, x:x + TILE]
            if (t < 200).mean() >= MIN_INK:
                tiles.append((x, y, _sharpness(t)))

    if len(tiles) < 5:
        return {"status": "no_content", "blur_score": None, "suspicious_regions": [],
                "explanation": "Not enough text/ink to judge sharpness."}

    median = float(np.median([s for _, _, s in tiles]))

    if median < GLOBAL_MIN:
        return {"status": "low_quality", "blur_score": round(median, 1), "suspicious_regions": [],
                "explanation": "Whole page is blurry. Treat as a poor scan, not tampering."}

    regions = [
        {"x": int(x / scale), "y": int(y / scale), "w": int(TILE / scale), "h": int(TILE / scale),
         "sharpness": round(s, 1)}
        for x, y, s in tiles if s < LOCAL_RATIO * median
    ]
    if regions:
        return {"status": "review", "blur_score": round(median, 1), "suspicious_regions": regions,
                "explanation": f"{len(regions)} region(s) much blurrier than the rest of the page. Needs human review."}
    return {"status": "ok", "blur_score": round(median, 1), "suspicious_regions": [],
            "explanation": "Sharpness is consistent across the page."}
