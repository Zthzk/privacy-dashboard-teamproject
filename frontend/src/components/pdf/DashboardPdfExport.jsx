// PDF export for the dashboard overview page.
// Exports DashboardPdfExportButton — a button that generates a PDF covering all
// projects, their risk levels, and the data category overview, then opens it in
// a new browser tab.
// DashboardReportDocument defines the PDF layout (sections, tables, text).
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
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
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
  // Column widths for the projects table
  colProject: { flex: 3 },
  colSources: { flex: 1, textAlign: 'center' },
  colRisk: { flex: 1.5 },
  colDate: { flex: 2 },
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

// Derives the risk label and corresponding PDF style for a project.
// Mirrors the resolution logic in Dashboard.jsx so the PDF matches the UI.
function resolveProjectRisk(project) {
  const riskValue = project.overall_status ?? project.risk_status ?? project.risk_level

  if (project.art_9_sources > 0 || riskValue === 'red') return { label: 'High', style: styles.riskHigh }
  if (riskValue === 'yellow' || riskValue === 'medium' || riskValue === 'high') return { label: 'Medium', style: styles.riskMedium }
  if ((project.high_risk_sources ?? 0) > 0) return { label: 'High', style: styles.riskHigh }
  if ((project.medium_risk_sources ?? 0) > 0 || (project.personal_data_sources ?? 0) > 0) return { label: 'Medium', style: styles.riskMedium }
  return { label: 'Low', style: styles.riskLow }
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

// The PDF document for the full dashboard overview.
// Receives already-loaded data so it renders synchronously without any fetching.
function DashboardReportDocument({ projects, riskSummary, generatedAt }) {
  const highRiskCount = projects.filter((p) => resolveProjectRisk(p).label === 'High').length
  const mediumRiskCount = projects.filter((p) => resolveProjectRisk(p).label === 'Medium').length
  const totalDataSources = projects.reduce((sum, p) => sum + (p.data_sources_count ?? 0), 0)

  return (
    <Document title={`Privacy Dashboard Report — ${generatedAt}`}>
      <Page size="A4" style={styles.page}>

        {/* Report header */}
        <Text style={styles.title}>Privacy Dashboard Report</Text>
        <Text style={styles.subtitle}>Generated: {generatedAt}</Text>

        {/* Aggregate risk summary */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total projects</Text>
          <Text style={styles.metricValue}>{projects.length}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total data sources</Text>
          <Text style={styles.metricValue}>{totalDataSources}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>High risk projects</Text>
          <Text style={[styles.metricValue, styles.riskHigh]}>{highRiskCount}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Medium risk projects</Text>
          <Text style={[styles.metricValue, styles.riskMedium]}>{mediumRiskCount}</Text>
        </View>

        {/* Data category breakdown from the dashboard Risk Summary card */}
        <Text style={styles.sectionTitle}>Data Category Overview</Text>
        {riskSummary.map((item) => (
          <View key={item.label} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        ))}

        {/* Per-project table */}
        <Text style={styles.sectionTitle}>Projects</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.colProject}>Project</Text>
          <Text style={styles.colSources}>Sources</Text>
          <Text style={styles.colRisk}>Risk</Text>
          <Text style={styles.colDate}>Last Updated</Text>
        </View>
        {projects.map((project) => {
          const risk = resolveProjectRisk(project)
          return (
            <View key={project.id} style={styles.tableRow}>
              <Text style={styles.colProject}>{project.name}</Text>
              <Text style={styles.colSources}>{project.data_sources_count ?? 0}</Text>
              <Text style={[styles.colRisk, risk.style]}>{risk.label}</Text>
              <Text style={styles.colDate}>{formatDate(project.updated_at)}</Text>
            </View>
          )
        })}

      </Page>
    </Document>
  )
}

// ─── Export Button ─────────────────────────────────────────────────────────────

// Renders the "Export PDF" button for the dashboard page.
// Builds the PDF on click and opens it in a new tab using the browser's native
// PDF viewer. Generation is deferred to click time — PDF rendering is
// CPU-intensive and many users never export, so building on mount wastes resources.
export default function DashboardPdfExportButton({ projects, riskSummary }) {
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
        <DashboardReportDocument
          projects={projects}
          riskSummary={riskSummary}
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
      disabled={generating}
    >
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}
