// PDF export for the dashboard overview page.
// Exports DashboardPdfExportButton — a button that generates a PDF covering all
// projects, their risk levels, and the data category overview, then opens it in
// a new browser tab.
// DashboardReportDocument defines the PDF layout (sections, tables, text).
// styles defines all colors, fonts, and spacing for that layout.
import React, { useState } from 'react'

import Button from '@mui/material/Button'
import logo from './favicon1.png'
import { FileTextOutlined } from '@ant-design/icons'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const COLOR = {
  navy:        '#1a3a5c',   // header background, section titles
  navyLight:   '#e8eef5',   // table header background
  blue:        '#2563eb',   // accent, links, metric values
  blueMid:     '#dbeafe',   // alternating row tint
  red:         '#c0392b',   // high risk
  redBg:       '#fef2f2',   // high risk row tint
  orange:      '#c2621b',   // medium risk
  green:       '#15803d',   // low risk
  black:       '#0f172a',   // primary text
  gray:        '#475569',   // secondary text
  grayLight:   '#e2e8f0',   // dividers
  grayRow:     '#f8fafc',   // alternating row
  white:       '#ffffff',
  accent:      '#c0392b',   // red accent line under header
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR.white,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLOR.black,
  },

  // ── Header band ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLOR.navy,
    paddingTop: 28,
    paddingHorizontal: 36,
    paddingBottom: 0,
  },
  headerAccentLine: {
    height: 3,
    backgroundColor: COLOR.accent,
    marginTop: 16,
  },
  headerLabel: {
    fontSize: 8,
    color: COLOR.blueMid,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.white,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 8,
    color: '#93c5fd',
    marginBottom: 0,
  },

  // ── Body ─────────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 36,
  },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sectionAccent: {
    width: 3,
    height: 13,
    backgroundColor: COLOR.blue,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.navy,
    letterSpacing: 0.2,
  },

  // ── Summary grid (4 KPI boxes) ────────────────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.grayLight,
    borderRadius: 4,
    padding: 10,
    backgroundColor: COLOR.grayRow,
  },
  kpiBoxRed: {
    borderColor: '#fca5a5',
    backgroundColor: COLOR.redBg,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: COLOR.gray,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.navy,
  },
  kpiValueRed: {
    color: COLOR.red,
  },
  kpiValueBlue: {
    color: COLOR.blue,
  },

  // ── Data category rows ────────────────────────────────────────────────────
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${COLOR.grayLight}`,
  },
  categoryRowAlt: {
    backgroundColor: COLOR.grayRow,
  },
  categoryLabel: {
    flex: 4,
    fontSize: 9,
    color: COLOR.black,
  },
  categoryValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.blue,
    textAlign: 'right',
  },

  // ── Projects table ────────────────────────────────────────────────────────
  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLOR.navyLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: `1.5pt solid ${COLOR.grayLight}`,
  },
  tableHeadCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.navy,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${COLOR.grayLight}`,
  },
  tableRowAlt: {
    backgroundColor: COLOR.grayRow,
  },
  tableRowHighRisk: {
    backgroundColor: COLOR.redBg,
  },
  tableCell: {
    fontSize: 9,
    color: COLOR.black,
  },

  // Column widths
  colProject: { flex: 3.5 },
  colSources: { flex: 1,   textAlign: 'center' },
  colRisk:    { flex: 1.5 },
  colDate:    { flex: 2 },

  // Risk badges
  riskHigh:   { color: COLOR.red,    fontFamily: 'Helvetica-Bold' },
  riskMedium: { color: COLOR.orange, fontFamily: 'Helvetica-Bold' },
  riskLow:    { color: COLOR.green,  fontFamily: 'Helvetica-Bold' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `0.5pt solid ${COLOR.grayLight}`,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: COLOR.gray,
  },
  footerBlue: {
    fontSize: 7.5,
    color: COLOR.blue,
    fontFamily: 'Helvetica-Bold',
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function resolveProjectRisk(project) {
  const riskValue = project.overall_status ?? project.risk_status ?? project.risk_level
  if (project.art_9_sources > 0 || riskValue === 'red')
    return { label: 'High', style: styles.riskHigh, isHigh: true }
  if (riskValue === 'yellow' || riskValue === 'medium' || riskValue === 'high')
    return { label: 'Medium', style: styles.riskMedium }
  if ((project.high_risk_sources ?? 0) > 0)
    return { label: 'High', style: styles.riskHigh, isHigh: true }
  if ((project.medium_risk_sources ?? 0) > 0 || (project.personal_data_sources ?? 0) > 0)
    return { label: 'Medium', style: styles.riskMedium }
  return { label: 'Low', style: styles.riskLow }
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

function DashboardReportDocument({ projects, riskSummary, generatedAt }) {
  const highRiskCount   = projects.filter((p) => resolveProjectRisk(p).label === 'High').length
  const mediumRiskCount = projects.filter((p) => resolveProjectRisk(p).label === 'Medium').length
  const totalDataSources = projects.reduce((sum, p) => sum + (p.data_sources_count ?? 0), 0)

  return (
    <Document title={`Privacy Dashboard Report — ${generatedAt}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Header band ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Privacy Report</Text>
          <Text style={styles.headerTitle}>Privacy Dashboard Report</Text>
          <Text style={styles.headerMeta}>Generated {generatedAt}</Text>
          <View style={styles.headerAccentLine} />
        </View>
        <View style={styles.body}>

          {/* ── KPI Summary ───────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>TOTAL PROJECTS</Text>
                <Text style={[styles.kpiValue, styles.kpiValueBlue]}>{projects.length}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>DATA SOURCES</Text>
                <Text style={[styles.kpiValue, styles.kpiValueBlue]}>{totalDataSources}</Text>
              </View>
              <View style={[styles.kpiBox, highRiskCount > 0 && styles.kpiBoxRed]}>
                <Text style={styles.kpiLabel}>HIGH RISK</Text>
                <Text style={[styles.kpiValue, highRiskCount > 0 ? styles.kpiValueRed : styles.kpiValueBlue]}>
                  {highRiskCount}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>MEDIUM RISK</Text>
                <Text style={styles.kpiValue}>{mediumRiskCount}</Text>
              </View>
            </View>
          </View>

          {/* ── Data Category Overview ────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Data Category Overview</Text>
            </View>
            <View>
              {riskSummary.map((item, index) => (
                <View
                  key={item.label}
                  style={[styles.categoryRow, index % 2 !== 0 && styles.categoryRowAlt]}
                >
                  <Text style={styles.categoryLabel}>{item.label}</Text>
                  <Text style={styles.categoryValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Projects Table ────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>

            {/* Table header */}
            <View style={styles.tableHead}>
              <Text style={[styles.tableHeadCell, styles.colProject]}>PROJECT</Text>
              <Text style={[styles.tableHeadCell, styles.colSources]}>SOURCES</Text>
              <Text style={[styles.tableHeadCell, styles.colRisk]}>RISK</Text>
              <Text style={[styles.tableHeadCell, styles.colDate]}>LAST UPDATED</Text>
            </View>

            {/* Table rows */}
            {projects.map((project, index) => {
              const risk = resolveProjectRisk(project)
              return (
                <View
                  key={project.id}
                  style={[
                    styles.tableRow,
                    risk.isHigh
                      ? styles.tableRowHighRisk
                      : index % 2 !== 0
                        ? styles.tableRowAlt
                        : null,
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colProject]}>{project.name}</Text>
                  <Text style={[styles.tableCell, styles.colSources]}>
                    {project.data_sources_count ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.colRisk, risk.style]}>{risk.label}</Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {formatDate(project.updated_at)}
                  </Text>
                </View>
              )
            })}
          </View>

        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Privacy Dashboard</Text>
          <Text style={styles.footerBlue}>
            {projects.length} projects · {totalDataSources} data sources
          </Text>
        </View>

      </Page>
    </Document>
  )
}
// ─── Export Button ─────────────────────────────────────────────────────────────

export default function DashboardPdfExportButton({ projects, riskSummary }) {
  const [generating, setGenerating] = useState(false)

  const generatedAt = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

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
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard-privacy-report.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      variant="contained"
      startIcon={<FileTextOutlined aria-hidden="true" />}
      onClick={handleExport}
      disabled={generating}
    >
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}
