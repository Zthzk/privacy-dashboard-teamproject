// PDF export for the project detail page.
// Exports ProjectPdfExportButton — a button that generates a per-project privacy
// report PDF and opens it in a new browser tab.
// ProjectReportDocument defines the PDF layout: project header, risk overview,
// recommendations, data sources table, and compliance violations per source.
// styles defines all colors, fonts, and spacing for that layout.
import { useState } from 'react'

import Button from '@mui/material/Button'
import { FileTextOutlined } from '@ant-design/icons'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

// ─── Styles ────────────────────────────────────────────────────────────────────
// All visual design for the report is defined here — colors, fonts, and spacing.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#555555',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  // Risk status banner shown below the section title
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskBannerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 6,
  },
  riskReason: {
    color: '#555555',
    marginBottom: 10,
  },
  // Metrics rows
  metricRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  metricLabel: {
    flex: 3,
    color: '#555555',
  },
  metricValue: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  // Recommendations list
  recommendationItem: {
    marginBottom: 4,
    paddingLeft: 8,
    color: '#333333',
  },
  // Data sources table
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottom: '1.5pt solid #cccccc',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '0.5pt solid #eeeeee',
  },
  // Column widths for the data sources table
  colName: { flex: 2.5 },
  colType: { flex: 1.5 },
  colFormat: { flex: 1.5 },
  colPersonal: { flex: 1 },
  colRisk: { flex: 1 },
  // Violations section
  violationSourceName: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 3,
  },
  violationItem: {
    paddingLeft: 10,
    marginBottom: 3,
    color: '#555555',
  },
  // Risk level text colors
  riskHigh: { color: '#d32f2f' },
  riskMedium: { color: '#ed6c02' },
  riskLow: { color: '#2e7d32' },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Formats an ISO date string to a short readable form (e.g. "Jun 27, 2026").
function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

// Maps an overall_status value ('red', 'yellow', 'green') to a human-readable
// label and the matching PDF style. Covers both the traffic-light strings from
// the backend and the word-form variants used in the fallback assessment.
function resolveOverallRisk(overallStatus) {
  if (overallStatus === 'red' || overallStatus === 'high') return { label: 'High Risk', style: styles.riskHigh }
  if (overallStatus === 'yellow' || overallStatus === 'medium') return { label: 'Medium Risk', style: styles.riskMedium }
  return { label: 'Low Risk', style: styles.riskLow }
}

// Maps a data source's risk_level field to a label and PDF style.
// Normalises both word-form ('high') and traffic-light ('red') values.
function resolveSourceRisk(source) {
  const level = String(source.risk_level ?? source.risk ?? '').toLowerCase()
  if (level === 'high' || level === 'red') return { label: 'High', style: styles.riskHigh }
  if (level === 'low' || level === 'green') return { label: 'Low', style: styles.riskLow }
  return { label: 'Medium', style: styles.riskMedium }
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

// The PDF document for a single project's privacy report.
// Sections: header → risk overview → recommendations → data sources table →
// compliance violations per source.
function ProjectReportDocument({ project, dataSources, riskAssessment, generatedAt }) {
  const metrics = riskAssessment?.metrics ?? {}
  const overallRisk = resolveOverallRisk(riskAssessment?.overall_status)

  // Only include sources that have at least one recorded violation.
  const sourcesWithViolations = dataSources.filter(
    (source) => Array.isArray(source.compliance_violations) && source.compliance_violations.length > 0
  )

  return (
    <Document title={`Privacy Report — ${project.name} — ${generatedAt}`}>
      <Page size="A4" style={styles.page}>

        {/* Report header */}
        <Text style={styles.title}>{project.name}</Text>
        {project.description ? (
          <Text style={styles.description}>{project.description}</Text>
        ) : null}
        <Text style={styles.subtitle}>
          Privacy Report · Generated: {generatedAt} · Last updated: {formatDate(project.updated_at)}
        </Text>

        {/* Risk overview */}
        <Text style={styles.sectionTitle}>Risk Overview</Text>
        <View style={styles.riskBanner}>
          <Text style={styles.riskBannerLabel}>Overall Status:</Text>
          <Text style={[styles.riskBannerLabel, overallRisk.style]}>{overallRisk.label}</Text>
        </View>
        {riskAssessment?.reason ? (
          <Text style={styles.riskReason}>{riskAssessment.reason}</Text>
        ) : null}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total data sources</Text>
          <Text style={styles.metricValue}>{metrics.total_data_sources ?? dataSources.length}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Sources with personal data</Text>
          <Text style={styles.metricValue}>{metrics.personal_data_sources ?? 0}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Art. 9 GDPR special category sources</Text>
          <Text style={[styles.metricValue, (metrics.art_9_sources ?? 0) > 0 ? styles.riskHigh : {}]}>
            {metrics.art_9_sources ?? 0}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>High risk sources</Text>
          <Text style={[styles.metricValue, (metrics.high_risk_sources ?? 0) > 0 ? styles.riskHigh : {}]}>
            {metrics.high_risk_sources ?? 0}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Medium risk sources</Text>
          <Text style={[styles.metricValue, (metrics.medium_risk_sources ?? 0) > 0 ? styles.riskMedium : {}]}>
            {metrics.medium_risk_sources ?? 0}
          </Text>
        </View>

        {/* Recommendations */}
        {riskAssessment?.recommendations?.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {riskAssessment.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
            ))}
          </>
        ) : null}

        {/* Data sources table */}
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.colName}>Name</Text>
          <Text style={styles.colType}>Type</Text>
          <Text style={styles.colFormat}>Format</Text>
          <Text style={styles.colPersonal}>Personal</Text>
          <Text style={styles.colRisk}>Risk</Text>
        </View>
        {dataSources.length === 0 ? (
          <Text style={{ color: '#888888', marginTop: 6 }}>No data sources found.</Text>
        ) : null}
        {dataSources.map((source) => {
          const risk = resolveSourceRisk(source)
          return (
            <View key={source.id ?? source.name} style={styles.tableRow}>
              <Text style={styles.colName}>{source.name}</Text>
              <Text style={styles.colType}>{source.source_type_display ?? source.source_type ?? '—'}</Text>
              <Text style={styles.colFormat}>{source.data_format_display ?? source.data_format ?? '—'}</Text>
              <Text style={styles.colPersonal}>{source.contains_personal_data ? 'Yes' : 'No'}</Text>
              <Text style={[styles.colRisk, risk.style]}>{risk.label}</Text>
            </View>
          )
        })}

        {/* Compliance violations per source — only shown when violations exist */}
        {sourcesWithViolations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Compliance Violations</Text>
            {sourcesWithViolations.map((source) => (
              <View key={source.id ?? source.name}>
                <Text style={styles.violationSourceName}>{source.name}</Text>
                {source.compliance_violations.map((violation, index) => (
                  <Text key={index} style={styles.violationItem}>• {violation}</Text>
                ))}
              </View>
            ))}
          </>
        ) : null}

      </Page>
    </Document>
  )
}

// ─── Export Button ─────────────────────────────────────────────────────────────

// Renders the "Export PDF" button for the project detail page.
// Disabled while data is still loading (riskAssessment is null) to prevent
// generating a report with incomplete information.
// Generation is deferred to click time — same reasoning as DashboardPdfExport.
export default function ProjectPdfExportButton({ project, dataSources, riskAssessment }) {
  const [generating, setGenerating] = useState(false)

  const generatedAt = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  // Generate the PDF blob, create a temporary object URL, and open it in a new tab.
  async function handleExport() {
    setGenerating(true)
    try {
      const blob = await pdf(
        <ProjectReportDocument
          project={project}
          dataSources={dataSources}
          riskAssessment={riskAssessment}
          generatedAt={generatedAt}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      variant="outlined"
      startIcon={<FileTextOutlined aria-hidden="true" />}
      onClick={handleExport}
      disabled={generating || !riskAssessment}
    >
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}
