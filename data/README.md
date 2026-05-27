# Synthetic Privacy Datasets

This folder contains synthetic datasets for the Privacy Dashboard project.

## Purpose

The goal of these datasets is to provide test data for the dashboard feature that shows whether a dataset contains personal data and whether it contains special categories of personal data under **Art. 9 GDPR**.


## Folder Structure

```text
data/
├── README.md
└── synthetic-datasets/
    ├── index.json
    ├── no_personal_data_weather.json
    ├── personal_data_newsletter.json
    ├── personal_data_support_tickets.json
    ├── art9_medical_notes.json
    ├── art9_survey_responses.json
    ├── image_metadata_street_camera.json
    └── uncertain_anonymized_reviews.json
```

## Dataset Format

Each JSON file represents one synthetic dataset.

Every dataset should follow this basic structure:

```json
{
  "id": "ds_001",
  "name": "Example Dataset",
  "type": "text",
  "description": "Short explanation of the dataset.",
  "contains_personal_data": true or false,
  "contains_art9_data": true or false,
  "risk_level": "color of risk",
  "detected_categories": ["name", "email"],
  "sample_records": []
}
```

## Required Fields

| Field | Description |
|---|---|
| `id` | Unique dataset identifier |
| `name` | Human-readable dataset name |
| `type` | Type of dataset, for example `text`, `tabular`, or `image` |
| `description` | Short explanation of what the dataset represents |
| `contains_personal_data` | Indicates whether the dataset contains personal data |
| `contains_art9_data` | Indicates whether the dataset contains special category data under Art. 9 GDPR |
| `risk_level` | Privacy risk level: `green`, `yellow`, or `red` |
| `detected_categories` | List of privacy-relevant categories found in the dataset |
| `sample_records` | Small preview of synthetic records used for testing |

## Risk Levels

The field `risk_level` is used by the dashboard to show a quick privacy status.

| Risk Level | Meaning |
|---|---|
| `green` | No personal data is present |
| `yellow` | Personal data is present, but no Art. 9 GDPR data is present |
| `red` | Special categories of personal data under Art. 9 GDPR are present |

## Art. 9 GDPR Examples

Special categories of personal data may include, for example:

- health data
- political opinions
- religious beliefs
- biometric data
- genetic data
- trade union membership
- sexual orientation

Datasets containing these categories should use:

```json
{
  "contains_art9_data": true,
  "risk_level": "red"
}
```

## Index File

The `index.json` file lists all available synthetic datasets.

Example:

```json
[
  "no_personal_data_weather.json",
  "personal_data_newsletter.json",
  "personal_data_support_tickets.json",
  "art9_medical_notes.json",
  "art9_survey_responses.json",
  "image_metadata_street_camera.json",
  "uncertain_anonymized_reviews.json"
]
```

The dashboard can use this file to load and display the available datasets.


