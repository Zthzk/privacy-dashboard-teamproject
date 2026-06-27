# Maps each compliance checklist label to its GDPR risk weight.
#
# Weights reflect the GDPR fine tier structure (Art. 83 GDPR):
#   3 — Art. 9 special category data (€20M / 4% turnover tier)
#   2 — Heightened personal data or prohibited EU AI Act practices (€15M / 3% tier equivalent)
#   1 — Standard personal data or general compliance obligations (€10M / 2% turnover tier)
#
# Labels are the same strings stored in DataSource.compliance_violations,
# which allows scoring without re-parsing the original checklist structure.

VIOLATION_WEIGHTS = {
    # ── Image ─────────────────────────────────────────────────────────────────
    "Faces or facial features (biometric data identification risks)":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "License plates or vehicle identifiers":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Personal documents (IDs, passports, driving licenses)":
        {"weight": 2, "article": "Art. 9/6 GDPR"},
    "Location-revealing landmarks or geotags":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Identifying clothing, badges, or accessories":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Medical conditions or physical traits visible in images":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Check if images were harvested via untargeted scraping":
        {"weight": 2, "article": "Art. 5(1)(e) EU AI Act"},
    "Evaluate if dataset representation has demographic gaps or biases":
        {"weight": 1, "article": "Art. 10 EU AI Act"},
    "Verify if images are synthetically generated and require machine-readable watermarking":
        {"weight": 1, "article": "Art. 50(2) EU AI Act"},
    "Identify if images show manipulated representations of real people requiring public disclosure":
        {"weight": 1, "article": "Art. 50(4) EU AI Act"},

    # ── Text ──────────────────────────────────────────────────────────────────
    "Names, surnames, and pseudonyms":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Email addresses and domain information":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Phone numbers and digital messaging handles":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Home, work, or corporate addresses":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "National identification numbers or tax identifiers":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Check for toxic language, hate speech, or historical biases within the text":
        {"weight": 1, "article": "Art. 10 EU AI Act"},
    "Verify presence of copyrighted text or content extracted in violation of opt-out mechanisms":
        {"weight": 1, "article": "Art. 53(1)(c) EU AI Act"},
    "Identify synthetic text that could be used for public information dissemination requiring labeling":
        {"weight": 1, "article": "Art. 50(4) EU AI Act"},

    # ── CSV ───────────────────────────────────────────────────────────────────
    "Customer, user, or employee record columns":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Financial data (account numbers, credit scores, transaction histories, salaries)":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Contact information columns (emails, phone numbers)":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Date of birth, age, or longevity fields":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Location data, GPS tracks, or IP address columns":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Scan for sensitive demographic attributes (gender, race, religion) that could trigger unintended proxy bias":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Ensure the data structure is not intended for forbidden social profiling or predictive policing models":
        {"weight": 2, "article": "Art. 5(1)(c)/(d) EU AI Act"},
    "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety":
        {"weight": 1, "article": "Art. 10 EU AI Act"},

    # ── JSON ──────────────────────────────────────────────────────────────────
    "Nested personal identifiers or key-value pairs mapping to real individuals":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "API responses containing live user profiles or tracking telemetry":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Session tokens, cookies, secrets, or authentication metadata":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Geolocation coordinates, tracking histories, or cell tower logs":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Device identifiers (MAC addresses, IMEI, advertising IDs)":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Review nested data preparation, transformation history, and labeling consistency":
        {"weight": 1, "article": "Art. 10 EU AI Act"},
    "Check if JSON structures power conversational interfaces or direct user agents requiring AI disclosure":
        {"weight": 1, "article": "Art. 50(1) EU AI Act"},

    # ── Audio ─────────────────────────────────────────────────────────────────
    "Voice recordings capable of identifying specific natural persons":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Conversations disclosing confidential, private, or proprietary information":
        {"weight": 2, "article": "Art. 6 GDPR"},
    "Health-related speech patterns or medical vocal biomarkers":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Emotional state indicators (restricted under certain AI Act domains)":
        {"weight": 2, "article": "Art. 5(1)(f) EU AI Act"},
    "Background noise or ambient acoustic signatures revealing specific locations":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Verify audio does not serve prohibited emotion analysis in employment or schooling":
        {"weight": 2, "article": "Art. 5(1)(f) EU AI Act"},
    "Assess phonetic and accent representation to mitigate algorithmic underperformance/bias":
        {"weight": 1, "article": "Art. 10 EU AI Act"},
    "Isolate voice clones or synthetic speech that must carry deepfake disclosure or watermarking labels":
        {"weight": 1, "article": "Art. 50(2)/(4) EU AI Act"},

    # ── Video ─────────────────────────────────────────────────────────────────
    "Faces, expressions, and micro-movements":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Gait, body posture, or unique behavioral kinetics":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Location data, visible time-stamps, and spatial tracking patterns":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "License plates, residential numbers, or vehicle VINs":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Identifiable clothing, organizational uniforms, or tactical gear":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Confirm video feeds do not stem from unauthorized public surveillance scraping":
        {"weight": 2, "article": "Art. 5(1)(e) EU AI Act"},
    "Analyze clip diversity for lighting variations, skin tones, and environmental setups to avoid bias":
        {"weight": 1, "article": "Art. 10 EU AI Act"},
    "Identify face-swaps, synthetic backgrounds, or deepfakes that legally demand disclosure labels":
        {"weight": 1, "article": "Art. 50(4) EU AI Act"},

    # ── Other ─────────────────────────────────────────────────────────────────
    "Any custom personal identifiers, encrypted tokens, or legacy indices":
        {"weight": 1, "article": "Art. 6 GDPR"},
    "Indirect special category indicators (proxies for health, orientation, or ethnicity)":
        {"weight": 3, "article": "Art. 9 GDPR"},
    "Ensure data minimization is strictly maintained prior to model ingest":
        {"weight": 1, "article": "Art. 5 GDPR"},
    "Verify data collection did not exploit vulnerable user states (age, disability) for behavioral distortion":
        {"weight": 2, "article": "Art. 5(1)(b) EU AI Act"},
    "Review documentation of origin, ownership, and ingestion logic for full compliance audit trails":
        {"weight": 1, "article": "Art. 5 GDPR"},
}
