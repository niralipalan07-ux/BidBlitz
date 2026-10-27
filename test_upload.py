from document_processor import extract_pdf


# This class simulates a file uploaded through Streamlit
class FakeUploadedFile:

    def __init__(self, filename):
        self.name = filename

        with open(filename, "rb") as file:
            self.file_bytes = file.read()

    def getvalue(self):
        return self.file_bytes


# Simulate uploading a tender PDF
uploaded_tender = FakeUploadedFile("sample_tender.pdf")

# Pass the uploaded file to your PDF processor
tender_pages = extract_pdf(uploaded_tender)

print("\n========== UPLOADED TENDER TEST ==========\n")

for page in tender_pages:
    print("Filename:", page["filename"])
    print("Page:", page["page"])
    print("Extracted text:")
    print(page["text"])
    print("----------------------------------")


# Simulate uploading a vendor PDF
uploaded_vendor = FakeUploadedFile("sample_vendor.pdf")

vendor_pages = extract_pdf(uploaded_vendor)

print("\n========== UPLOADED VENDOR TEST ==========\n")

for page in vendor_pages:
    print("Filename:", page["filename"])
    print("Page:", page["page"])
    print("Extracted text:")
    print(page["text"])
    print("----------------------------------")