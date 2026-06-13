export function getDataSourcePreviewText(source) {
  // Prefer the API preview field, but keep older cached/manual entries previewable.
  return source?.preview_text || source?.metadata?.preview_text || source?.metadata?.manual_data || ''
}

export function getComplianceFindings(source) {
  // The backend stores user-selected non-compliance checklist items in this array.
  return Array.isArray(source?.compliance_violations) ? source.compliance_violations : []
}
