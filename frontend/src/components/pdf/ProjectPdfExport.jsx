// PDF export for the project detail page.
// Exports ProjectPdfExportButton — a button that generates a per-project privacy
// report PDF and opens it in a new browser tab.
// ProjectReportDocument defines the PDF layout: project header, risk overview,
// recommendations, data sources table, and compliance violations per source.
// styles defines all colors, fonts, and spacing for that layout.
import React, { useState } from 'react'

import Button from '@mui/material/Button'
import { FileTextOutlined } from '@ant-design/icons'
import logo from './favicon1.png'
import { Document, Page, StyleSheet, Text, View, Image, pdf } from '@react-pdf/renderer'

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const COLOR = {
  navy:       '#1a3a5c',
  navyLight:  '#e8eef5',
  blue:       '#2563eb',
  blueMid:    '#dbeafe',
  red:        '#c0392b',
  redBg:      '#fef2f2',
  orange:     '#c2621b',
  green:      '#15803d',
  black:      '#0f172a',
  gray:       '#475569',
  grayLight:  '#e2e8f0',
  grayRow:    '#f8fafc',
  white:      '#ffffff',
  accent:     '#c0392b',
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
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.white,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 9,
    color: '#93c5fd',
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 8,
    color: '#64a0d4',
    marginBottom: 0,
  },

  // ── Body ─────────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 48,
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
  sectionAccentRed: {
    width: 3,
    height: 13,
    backgroundColor: COLOR.red,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.navy,
    letterSpacing: 0.2,
  },

  // ── Risk banner ───────────────────────────────────────────────────────────────
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR.navyLight,
    borderLeft: `3pt solid ${COLOR.navy}`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 2,
  },
  riskBannerHigh: {
    backgroundColor: COLOR.redBg,
    borderLeft: `3pt solid ${COLOR.red}`,
  },
  riskBannerMedium: {
    backgroundColor: '#fff7ed',
    borderLeft: `3pt solid ${COLOR.orange}`,
  },
  riskBannerLabel: {
    fontSize: 8,
    color: COLOR.gray,
    letterSpacing: 0.5,
    marginRight: 4,
  },
  riskBannerValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  riskReason: {
    fontSize: 9,
    color: COLOR.gray,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  // ── Metrics ───────────────────────────────────────────────────────────────────
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${COLOR.grayLight}`,
  },
  metricRowAlt: {
    backgroundColor: COLOR.grayRow,
  },
  metricLabel: {
    flex: 4,
    fontSize: 9,
    color: COLOR.black,
  },
  metricValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.blue,
    textAlign: 'right',
  },

  // ── Recommendations ───────────────────────────────────────────────────────────
  recommendationItem: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${COLOR.grayLight}`,
    gap: 6,
  },
  recommendationBullet: {
    fontSize: 9,
    color: COLOR.blue,
    fontFamily: 'Helvetica-Bold',
    width: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 9,
    color: COLOR.black,
  },

  // ── Data sources table ────────────────────────────────────────────────────────
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
  tableEmpty: {
    fontSize: 9,
    color: COLOR.gray,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },

  // Column widths
  colName:     { flex: 2.5 },
  colType:     { flex: 1.5 },
  colFormat:   { flex: 1.5 },
  colPersonal: { flex: 1,   textAlign: 'center' },
  colRisk:     { flex: 1 },

  // ── Violations ────────────────────────────────────────────────────────────────
  violationBlock: {
    marginBottom: 10,
    borderLeft: `2pt solid ${COLOR.red}`,
    paddingLeft: 10,
  },
  violationSourceName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.navy,
    marginBottom: 4,
  },
  violationItem: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  violationBullet: {
    fontSize: 9,
    color: COLOR.red,
    fontFamily: 'Helvetica-Bold',
    width: 10,
  },
  violationText: {
    flex: 1,
    fontSize: 9,
    color: COLOR.gray,
  },

  // Risk level text colors
  riskHigh:   { color: COLOR.red,    fontFamily: 'Helvetica-Bold' },
  riskMedium: { color: COLOR.orange, fontFamily: 'Helvetica-Bold' },
  riskLow:    { color: COLOR.green,  fontFamily: 'Helvetica-Bold' },

  // ── Footer ────────────────────────────────────────────────────────────────────
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

function resolveOverallRisk(overallStatus) {
  if (overallStatus === 'red'    || overallStatus === 'high')   return { label: 'High Risk',   style: styles.riskHigh,   bannerStyle: styles.riskBannerHigh }
  if (overallStatus === 'yellow' || overallStatus === 'medium') return { label: 'Medium Risk', style: styles.riskMedium, bannerStyle: styles.riskBannerMedium }
  return { label: 'Low Risk', style: styles.riskLow, bannerStyle: null }
}

function resolveSourceRisk(source) {
  const level = String(source.risk_level ?? source.risk ?? '').toLowerCase()
  if (level === 'high' || level === 'red')   return { label: 'High',   style: styles.riskHigh,   isHigh: true }
  if (level === 'low'  || level === 'green') return { label: 'Low',    style: styles.riskLow }
  return { label: 'Medium', style: styles.riskMedium }
}

// ─── PDF Document ──────────────────────────────────────────────────────────────

function ProjectReportDocument({ project, dataSources, riskAssessment, generatedAt }) {
  const metrics      = riskAssessment?.metrics ?? {}
  const overallRisk  = resolveOverallRisk(riskAssessment?.overall_status)

  const sourcesWithViolations = dataSources.filter(
    (source) => Array.isArray(source.compliance_violations) && source.compliance_violations.length > 0,
  )

  const metricRows = [
    { label: 'Total data sources', key: 'total_data_sources', fallback: dataSources.length, redWhen: false },
    { label: 'Sources with personal data', key: 'personal_data_sources', fallback: 0, redWhen: false },
    { label: 'Art. 9 GDPR special category', key: 'art_9_sources', fallback: 0, redWhen: true  },
    { label: 'High risk sources', key: 'high_risk_sources', fallback: 0, redWhen: true  },
    { label: 'Medium risk sources', key: 'medium_risk_sources', fallback: 0, redWhen: false },
  ]

  return (
    <Document title={`Privacy Report — ${project.name} — ${generatedAt}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Header band ─────────────────────────────────────────────────── */}

        <View style={styles.header}>
          {}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.headerLabel}>Privacy Report</Text>
              <Text style={styles.headerTitle}>{project.name}</Text>
              {project.description ? (
                <Text style={styles.headerDescription}>{project.description}</Text>
              ) : null}
              <Text style={styles.headerMeta}>Generated {generatedAt} · Last updated {formatDate(project.updated_at)}</Text>
            </View>
            <Image src={logo} style={{ width: 60, height: 60, marginTop: 4 }} />
          </View>
          <View style={styles.headerAccentLine} />
          </View>
        <View style={styles.body}>

          {/* ── Risk Overview ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={overallRisk.label === 'High Risk' ? styles.sectionAccentRed : styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Risk Overview</Text>
            </View>

            {/* Risk banner */}
            <View style={[styles.riskBanner, overallRisk.bannerStyle]}>
              <Text style={styles.riskBannerLabel}>OVERALL STATUS</Text>
              <Text style={[styles.riskBannerValue, overallRisk.style]}>{overallRisk.label}</Text>
            </View>

            {riskAssessment?.reason ? (
              <Text style={styles.riskReason}>{riskAssessment.reason}</Text>
            ) : null}

            {/* Metrics */}
            {metricRows.map(({ label, key, fallback, redWhen }, index) => {
              const value   = metrics[key] ?? fallback
              const isAlert = redWhen && value > 0
              return (
                <View key={key} style={[styles.metricRow, index % 2 !== 0 && styles.metricRowAlt]}>
                  <Text style={styles.metricLabel}>{label}</Text>
                  <Text style={[styles.metricValue, isAlert && styles.riskHigh]}>{value}</Text>
                </View>
              )
            })}
          </View>

          {/* ── Recommendations ───────────────────────────────────────────── */}
          {riskAssessment?.recommendations?.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              {riskAssessment.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>-</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Data Sources Table ────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Data Sources</Text>
            </View>

            <View style={styles.tableHead}>
              <Text style={[styles.tableHeadCell, styles.colName]}>NAME</Text>
              <Text style={[styles.tableHeadCell, styles.colType]}>TYPE</Text>
              <Text style={[styles.tableHeadCell, styles.colFormat]}>FORMAT</Text>
              <Text style={[styles.tableHeadCell, styles.colPersonal]}>PERSONAL</Text>
              <Text style={[styles.tableHeadCell, styles.colRisk]}>RISK</Text>
            </View>

            {dataSources.length === 0 ? (
              <Text style={styles.tableEmpty}>No data sources found.</Text>
            ) : null}

            {dataSources.map((source, index) => {
              const risk = resolveSourceRisk(source)
              return (
                <View
                  key={source.id ?? source.name}
                  style={[
                    styles.tableRow,
                    risk.isHigh
                      ? styles.tableRowHighRisk
                      : index % 2 !== 0
                        ? styles.tableRowAlt
                        : null,
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colName]}>{source.name}</Text>
                  <Text style={[styles.tableCell, styles.colType]}>
                    {source.source_type_display ?? source.source_type ?? '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colFormat]}>
                    {source.data_format_display ?? source.data_format ?? '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPersonal]}>
                    {source.contains_personal_data ? 'Yes' : 'No'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colRisk, risk.style]}>{risk.label}</Text>
                </View>
              )
            })}
          </View>

          {/* ── Compliance Violations ─────────────────────────────────────── */}
          {sourcesWithViolations.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccentRed} />
                <Text style={styles.sectionTitle}>Compliance Violations</Text>
              </View>
              {sourcesWithViolations.map((source) => (
                <View key={source.id ?? source.name} style={styles.violationBlock}>
                  <Text style={styles.violationSourceName}>{source.name}</Text>
                  {source.compliance_violations.map((violation, index) => (
                    <View key={index} style={styles.violationItem}>
                      <Text style={styles.violationBullet}>!</Text>
                      <Text style={styles.violationText}>{violation}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{project.name} · Privacy Report</Text>
          <Text style={styles.footerBlue}>{dataSources.length} data sources</Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── Export Button ─────────────────────────────────────────────────────────────

export default function ProjectPdfExportButton({ project, dataSources, riskAssessment }) {
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
        <ProjectReportDocument
          project={project}
          dataSources={dataSources}
          riskAssessment={riskAssessment}
          generatedAt={generatedAt}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `privacy-report-${project.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
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
      disabled={generating || !riskAssessment}
    >
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}