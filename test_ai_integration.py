from ai_extractor import process_tender_with_ai


print("\n========== BIDBLITZ AI INTEGRATION TEST ==========\n")

try:

    requirements = process_tender_with_ai("sample_tender.pdf")

    print("Total requirements extracted:", len(requirements))

    for item in requirements:

        print("\nRequirement:", item["requirement"])
        print("Value:", item["value"])
        print("Page:", item["page"])
        print("Filename:", item["filename"])

    print("\nAI INTEGRATION TEST COMPLETED!")

except Exception as error:

    print("\nAI EXTRACTION ERROR")
    print("Something went wrong while processing the tender.")
    print("Details:", error)