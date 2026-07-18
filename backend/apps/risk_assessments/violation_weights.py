# Maps each compliance checklist label to a privacy-risk weight (1-3).
#
# The weight is a severity proxy, not a literal fine-tier mapping: the GDPR and
# the EU AI Act have separate, non-comparable penalty scales, so a single number
# cannot reproduce both exactly. The scale is instead ordered so that nothing
# legally more severe is ever ranked below something less severe:
#   3 — Highest regulatory risk: GDPR Art. 9 special category data
#       (Art. 83(5): €20M / 4% tier) AND EU AI Act Art. 5 prohibited practices
#       (Art. 99(3): €35M / 7% tier — the single most severe category in either law).
#   2 — Elevated risk: heightened personal data (e.g. financial data, ID numbers)
#       and EU AI Act Art. 10 / 50 governance & transparency obligations
#       (Art. 99(4): €15M / 3% tier).
#   1 — Standard personal data under GDPR Art. 6, plus lower-severity obligations
#       such as the GPAI copyright duty (Art. 53, a separate copyright regime).
#
# Note: under the GDPR, Art. 6 and Art. 9 share the same statutory ceiling
# (€20M / 4%). Art. 9 still scores higher because Art. 83(2)(g) names the
# category of personal data as an aggravating factor when the actual fine is set.
#
# Labels are the same strings stored in DataSource.compliance_violations,
# which allows scoring without re-parsing the original checklist structure.

VIOLATION_WEIGHTS = {
    # Image — faces and visible medical traits are the most sensitive content here.
    "Faces or facial features (biometric data identification risks)":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    "License plates or vehicle identifiers":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Personal documents (IDs, passports, driving licenses)":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Location-revealing landmarks or geotags":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Identifying clothing, badges, or accessories":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Medical conditions or physical traits visible in images":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Check if images were harvested via untargeted scraping":
        {"weight": 3, "article": "Art. 5(1)(e) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Evaluate if dataset representation has demographic gaps or biases":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Verify if images are synthetically generated and require machine-readable watermarking":
        {"weight": 2, "article": "Art. 50(2) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Identify if images show manipulated representations of real people requiring public disclosure":
        {"weight": 2, "article": "Art. 50(4) EU AI Act", "is_personal_data": True, "is_art_9": False},

    # Text — mostly everyday contact details and written identifiers.
    "Names, surnames, and pseudonyms":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Email addresses and domain information":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Phone numbers and digital messaging handles":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    # Conservative product simplification: some corporate addresses may not
    # identify a person, but this mixed label is classified as personal data.
    "Home, work, or corporate addresses":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "National identification numbers or tax identifiers":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Check for toxic language, hate speech, or historical biases within the text":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Verify presence of copyrighted text or content extracted in violation of opt-out mechanisms":
        {"weight": 1, "article": "Art. 53(1)(c) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Identify synthetic text that could be used for public information dissemination requiring labeling":
        {"weight": 2, "article": "Art. 50(4) EU AI Act", "is_personal_data": False, "is_art_9": False},

    # CSV — structured columns of personal, financial, and demographic data.
    "Customer, user, or employee record columns":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Financial data (account numbers, credit scores, transaction histories, salaries)":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Contact information columns (emails, phone numbers)":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Date of birth, age, or longevity fields":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Location data, GPS tracks, or IP address columns":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    # Candidate for splitting later: race and religion are Art. 9 categories,
    # while gender is not automatically Art. 9.
    "Scan for sensitive demographic attributes (gender, race, religion) that could trigger unintended proxy bias":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Ensure the data structure is not intended for forbidden social profiling or predictive policing models":
        {"weight": 3, "article": "Art. 5(1)(c)/(d) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},

    # JSON — personal data is often buried in nested keys, tokens, and coordinates.
    "Nested personal identifiers or key-value pairs mapping to real individuals":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "API responses containing live user profiles or tracking telemetry":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    # Conservative product simplification: some secrets are system-only, but
    # session tokens and cookies can identify or track users.
    "Session tokens, cookies, secrets, or authentication metadata":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Geolocation coordinates, tracking histories, or cell tower logs":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Device identifiers (MAC addresses, IMEI, advertising IDs)":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Review nested data preparation, transformation history, and labeling consistency":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Check if JSON structures power conversational interfaces or direct user agents requiring AI disclosure":
        {"weight": 2, "article": "Art. 50(1) EU AI Act", "is_personal_data": False, "is_art_9": False},

    # Audio — voices and health-revealing speech are the sensitive parts.
    "Voice recordings capable of identifying specific natural persons":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    "Conversations disclosing confidential, private, or proprietary information":
        {"weight": 2, "article": "Art. 6 GDPR", "is_personal_data": False, "is_art_9": False},
    "Health-related speech patterns or medical vocal biomarkers":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Emotional state indicators (restricted under certain AI Act domains)":
        {"weight": 3, "article": "Art. 5(1)(f) EU AI Act", "is_personal_data": True, "is_art_9": False},
    "Background noise or ambient acoustic signatures revealing specific locations":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": False, "is_art_9": False},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Verify audio does not serve prohibited emotion analysis in employment or schooling":
        {"weight": 3, "article": "Art. 5(1)(f) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Assess phonetic and accent representation to mitigate algorithmic underperformance/bias":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Isolate voice clones or synthetic speech that must carry deepfake disclosure or watermarking labels":
        {"weight": 2, "article": "Art. 50(2)/(4) EU AI Act", "is_personal_data": True, "is_art_9": False},

    # Video — faces and body movement make this the most identifying format.
    "Faces, expressions, and micro-movements":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    "Gait, body posture, or unique behavioral kinetics":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    "Location data, visible time-stamps, and spatial tracking patterns":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "License plates, residential numbers, or vehicle VINs":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Identifiable clothing, organizational uniforms, or tactical gear":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Confirm video feeds do not stem from unauthorized public surveillance scraping":
        {"weight": 3, "article": "Art. 5(1)(e) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Analyze clip diversity for lighting variations, skin tones, and environmental setups to avoid bias":
        {"weight": 2, "article": "Art. 10 EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Identify face-swaps, synthetic backgrounds, or deepfakes that legally demand disclosure labels":
        {"weight": 2, "article": "Art. 50(4) EU AI Act", "is_personal_data": True, "is_art_9": False},

    # Other — a catch-all for data that doesn't fit a specific format.
    "Any custom personal identifiers, encrypted tokens, or legacy indices":
        {"weight": 1, "article": "Art. 6 GDPR", "is_personal_data": True, "is_art_9": False},
    "Indirect special category indicators (proxies for health, orientation, or ethnicity)":
        {"weight": 3, "article": "Art. 9 GDPR", "is_personal_data": True, "is_art_9": True},
    "Ensure data minimization is strictly maintained prior to model ingest":
        {"weight": 1, "article": "Art. 5 GDPR", "is_personal_data": False, "is_art_9": False},
    # Art. 5 EU AI Act prohibited practice — top penalty tier (Art. 99(3): €35M / 7%).
    "Verify data collection did not exploit vulnerable user states (age, disability) for behavioral distortion":
        {"weight": 3, "article": "Art. 5(1)(b) EU AI Act", "is_personal_data": False, "is_art_9": False},
    "Review documentation of origin, ownership, and ingestion logic for full compliance audit trails":
        {"weight": 1, "article": "Art. 5 GDPR", "is_personal_data": False, "is_art_9": False},
}
