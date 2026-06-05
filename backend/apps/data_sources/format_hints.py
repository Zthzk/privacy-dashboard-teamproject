# Privacy hint configuration for each supported data format.
# Legally audited against GDPR and EU AI Act (Regulation (EU) 2024/1689).
#
# Each entry contains:
#   hint               — a short description shown in the data source form
#   art9_risk          — True if this format commonly contains Art. 9 GDPR special-category data
#   suggested_categories — data categories the user should consider tagging
#   relevant_articles  — GDPR and EU AI Act articles that may apply to this format
#   checklist          — concrete things to look for when reviewing the dataset
#
# Kept in a separate module so views.py stays focused on request handling
# and this content can be updated without touching any business logic.
DATA_FORMAT_HINTS = {
    "image": {
        "hint": "Image datasets may contain faces, license plates, biometric features, or data subject to strict EU AI Act prohibitions.",
        "art9_risk": True,  # Faces and biometric data fall under Art. 9 GDPR
        "suggested_categories": ["faces", "license_plates", "biometric_data", "synthetic_images"],
        "relevant_articles": [
            "Art. 4(14) GDPR — Definition of biometric data",
            "Art. 9 GDPR — Prohibition on processing biometric data for unique identification",
            "Art. 35 GDPR — Data Protection Impact Assessment required for large-scale biometric processing",
            "Art. 5(1)(e) EU AI Act — Prohibition on creating facial recognition databases through untargeted web/CCTV scraping",
            "Art. 5(1)(g) EU AI Act — Prohibition on biometric categorization systems inferring sensitive traits (race, politics)",
            "Art. 10 EU AI Act — Data and data governance requirements for high-risk AI (bias detection and mitigation)",
            "Art. 50(2) EU AI Act — Transparency obligations: provider duty to mark and detect artificially generated images (Synthetic Media)",
            "Art. 50(4) EU AI Act — Transparency obligations: deployer duty to disclose manipulated images mimicking real entities (Deepfakes)",
        ],
        "checklist": [
            "Faces or facial features (biometric data identification risks)",
            "License plates or vehicle identifiers",
            "Personal documents (IDs, passports, driving licenses)",
            "Location-revealing landmarks or geotags",
            "Identifying clothing, badges, or accessories",
            "Medical conditions or physical traits visible in images",
            "Check if images were harvested via untargeted scraping (Prohibited under Art. 5 AI Act)",
            "Evaluate if dataset representation has demographic gaps or biases (Art. 10 AI Act)",
            "Verify if images are synthetically generated and require machine-readable watermarking (Art. 50(2) AI Act)",
            "Identify if images show manipulated representations of real people requiring public disclosure (Art. 50(4) AI Act)",
        ],
    },
    "text": {
        "hint": "Text datasets often contain names, emails, contact details, or training content subject to data quality and copyright obligations.",
        "art9_risk": False,
        "suggested_categories": ["names", "emails", "addresses", "copyrighted_content", "sensitive_narratives"],
        "relevant_articles": [
            "Art. 4(1) GDPR — Definition of personal data",
            "Art. 6 GDPR — Lawfulness of processing",
            "Art. 17 GDPR — Right to erasure ('Right to be forgotten')",
            "Art. 10 EU AI Act — Data governance and quality management for high-risk AI models (bias and error analysis)",
            "Art. 50(4) EU AI Act — Disclosure obligations for AI-generated text published to inform the public on matters of public interest",
            "Art. 53(1)(c) EU AI Act — Obligations for general-purpose AI (GPAI) providers to comply with Union copyright law (TDM opt-out)",
            "Art. 53(1)(d) EU AI Act — Obligations for general-purpose AI (GPAI) providers to draw up and publicly summarize training content",
        ],
        "checklist": [
            "Names, surnames, and pseudonyms",
            "Email addresses and domain information",
            "Phone numbers and digital messaging handles",
            "Home, work, or corporate addresses",
            "National identification numbers or tax identifiers",
            "Check for toxic language, hate speech, or historical biases within the text (Art. 10 AI Act)",
            "Verify presence of copyrighted text or content extracted in violation of opt-out mechanisms (Art. 53(1)(c) AI Act)",
            "Identify synthetic text that could be used for public information dissemination requiring labeling (Art. 50(4) AI Act)",
        ],
    },
    "csv": {
        "hint": "CSV datasets may contain structured personal, financial, or demographic data critical for bias testing and high-risk AI compliance.",
        "art9_risk": False,
        "suggested_categories": ["names", "addresses", "IDs", "demographic_attributes", "financial_records"],
        "relevant_articles": [
            "Art. 4(1) GDPR — Definition of personal data",
            "Art. 5 GDPR — Principles of data processing (minimization, accuracy)",
            "Art. 25 GDPR — Data protection by design and by default",
            "Art. 5(1)(c) EU AI Act — Prohibition on AI social scoring leading to detrimental/unfavorable treatment",
            "Art. 5(1)(d) EU AI Act — Prohibition on criminal risk assessments or predictive policing based solely on profiling",
            "Art. 10 EU AI Act — Requirements for training, validation, and testing data sets to be representative and free of errors",
        ],
        "checklist": [
            "Customer, user, or employee record columns",
            "Financial data (account numbers, credit scores, transaction histories, salaries)",
            "Contact information columns (emails, phone numbers)",
            "Date of birth, age, or longevity fields",
            "Location data, GPS tracks, or IP address columns",
            "Scan for sensitive demographic attributes (gender, race, religion) that could trigger unintended proxy bias (Art. 10 AI Act)",
            "Ensure the data structure is not intended for forbidden social profiling or predictive policing models (Art. 5 AI Act)",
            "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety (Art. 10 AI Act)",
        ],
    },
    "json": {
        "hint": "JSON datasets may contain nested personal data, metadata, or API interaction logs that dictate transparency and tracking.",
        "art9_risk": False,
        "suggested_categories": ["names", "emails", "IDs", "metadata", "api_interaction_logs"],
        "relevant_articles": [
            "Art. 4(1) GDPR — Definition of personal data",
            "Art. 5 GDPR — Principles of data processing",
            "Art. 20 GDPR — Right to data portability",
            "Art. 10 EU AI Act — Formal data-preparation processing operations (annotation, labeling, cleaning provenance)",
            "Art. 50(1) EU AI Act — Transparency obligation to inform natural persons when interacting directly with an AI system",
        ],
        "checklist": [
            "Nested personal identifiers or key-value pairs mapping to real individuals",
            "API responses containing live user profiles or tracking telemetry",
            "Session tokens, cookies, secrets, or authentication metadata",
            "Geolocation coordinates, tracking histories, or cell tower logs",
            "Device identifiers (MAC addresses, IMEI, advertising IDs)",
            "Review nested data preparation, transformation history, and labeling consistency (Art. 10 AI Act)",
            "Check if JSON structures power conversational interfaces or direct user agents requiring AI disclosure (Art. 50(1) AI Act)",
        ],
    },
    "audio": {
        "hint": "Audio datasets may contain voice prints (biometric identifiers) and emotional cues restricted under EU safety rules.",
        "art9_risk": True,  # Voice is a biometric identifier under Art. 9 GDPR
        "suggested_categories": ["voice_data", "biometric_data", "emotional_audio", "synthetic_speech"],
        "relevant_articles": [
            "Art. 4(14) GDPR — Definition of biometric data (encompassing unique voice features)",
            "Art. 9 GDPR — Prohibition on processing biometric data for unique identification",
            "Art. 35 GDPR — Data Protection Impact Assessment required for large-scale audio processing",
            "Art. 5(1)(f) EU AI Act — Prohibition on AI emotion recognition in workplace or educational settings",
            "Art. 10 EU AI Act — Dataset representativeness across diverse accents, speech impairments, ages, and dialects",
            "Art. 50(2) EU AI Act — Transparency rules: provider duty to mark and detect artificially generated audio (Synthetic Speech)",
            "Art. 50(4) EU AI Act — Transparency rules: deployer duty to disclose artificially manipulated voice clones (Audio Deepfakes)",
        ],
        "checklist": [
            "Voice recordings capable of identifying specific natural persons",
            "Conversations disclosing confidential, private, or proprietary information",
            "Health-related speech patterns or medical vocal biomarkers",
            "Emotional state indicators (restricted under certain AI Act domains)",
            "Background noise or ambient acoustic signatures revealing specific locations",
            "Verify audio does not serve prohibited emotion analysis in employment or schooling (Art. 5(1)(f) AI Act)",
            "Assess phonetic and accent representation to mitigate algorithmic underperformance/bias (Art. 10 AI Act)",
            "Isolate voice clones or synthetic speech that must carry deepfake disclosure or watermarking labels (Art. 50 AI Act)",
        ],
    },
    "video": {
        "hint": "Video datasets encompass complex combinations of biometric, behavioral, and spatial metadata needing severe screening.",
        "art9_risk": True,  # Facial and movement data are biometric identifiers under Art. 9 GDPR
        "suggested_categories": ["faces", "biometric_data", "behavioral_data", "surveillance_footage", "deepfakes"],
        "relevant_articles": [
            "Art. 4(14) GDPR — Definition of biometric data",
            "Art. 9 GDPR — Prohibition on processing biometric data for unique identification",
            "Art. 35 GDPR — DPIA mandatory for large-scale systematic public monitoring",
            "Art. 5(1)(e) EU AI Act — Prohibition on untargeted scraping of CCTV or internet video for facial recognition",
            "Art. 5(1)(h) EU AI Act — Prohibitions on real-time remote biometric identification in public spaces for law enforcement",
            "Art. 10 EU AI Act — Rigorous data governance, bias auditing, and documentation for multi-modal datasets",
            "Art. 50(4) EU AI Act — Mandatory clear and distinguishable labeling for synthetic or manipulated videos (Deepfakes)",
        ],
        "checklist": [
            "Faces, expressions, and micro-movements",
            "Gait, body posture, or unique behavioral kinetics",
            "Location data, visible time-stamps, and spatial tracking patterns",
            "License plates, residential numbers, or vehicle VINs",
            "Identifiable clothing, organizational uniforms, or tactical gear",
            "Confirm video feeds do not stem from unauthorized public surveillance scraping (Art. 5 AI Act)",
            "Analyze clip diversity for lighting variations, skin tones, and environmental setups to avoid bias (Art. 10 AI Act)",
            "Identify face-swaps, synthetic backgrounds, or deepfakes that legally demand disclosure labels (Art. 50(4) AI Act)",
        ],
    },
    "other": {
        "hint": "Custom or unclassified datasets must be audited against generic data minimization and systemic safety bans.",
        "art9_risk": False,
        "suggested_categories": ["unclassified_identifiers", "special_category_proxies"],
        "relevant_articles": [
            "Art. 4(1) GDPR — Definition of personal data",
            "Art. 5 GDPR — Principles of data processing (minimization, purpose limitation)",
            "Art. 5(1)(a) & (b) EU AI Act — Prohibitions on subliminal manipulation and exploitation of vulnerable groups",
            "Art. 10 EU AI Act — General data quality and documented provenance rules for advanced models",
        ],
        "checklist": [
            "Any custom personal identifiers, encrypted tokens, or legacy indices",
            "Indirect special category indicators (proxies for health, orientation, or ethnicity)",
            "Ensure data minimization is strictly maintained prior to model ingest",
            "Verify data collection did not exploit vulnerable user states (age, disability) for behavioral distortion (Art. 5(1)(b) AI Act)",
            "Review documentation of origin, ownership, and ingestion logic for full compliance audit trails (Art. 10 AI Act)",
        ],
    },
}
