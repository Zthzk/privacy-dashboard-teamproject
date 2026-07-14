export function getDataSourcePreviewText(source) {
  return source?.metadata?.manual_data || ''
}

export function getComplianceFindings(source) {
  // The backend stores user-selected non-compliance checklist items in this array.
  return Array.isArray(source?.compliance_violations) ? source.compliance_violations : []
}
