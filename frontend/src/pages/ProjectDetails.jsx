import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import OutlinedInput from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  DatabaseFilled,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExperimentFilled,
  EyeOutlined,
  FileFilled,
  FileTextOutlined,
  FolderFilled,
  GlobalOutlined,
  HistoryOutlined,
  HeartFilled,
  IdcardOutlined,
  LeftOutlined,
  MailOutlined,
  PlusCircleFilled,
  SafetyCertificateFilled,
  SearchOutlined,
  UserOutlined,
  WarningFilled,
} from '@ant-design/icons'

import DataSourceVersionHistoryDialog from 'components/DataSourceVersionHistoryDialog'
import DatasetPreviewDialog from 'components/DatasetPreviewDialog'
import MainCard from 'components/MainCard'
import ProjectPdfExportButton from 'components/pdf/ProjectPdfExport'
import { deleteDataSource } from 'api/dataSources'
import { getProjectOverview, updateProject } from 'api/projects'
import { readCachedDataSources, writeCachedDataSources } from 'utils/data-source-cache'
import {
  readCachedProjects,
  readProjectStyleOverrides,
  writeCachedProjects,
  writeProjectStyleOverride,
} from 'utils/project-cache'
import { applyProjectStyleOverrides, getProjectStyle, projectColorOptions, projectIconMap, projectIconOptions } from 'utils/project-display'

const initialEditForm = {
  name: '',
  description: '',
  icon_key: 'message',
  color: 'primary',
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getRiskChip(riskLevel) {
  if (riskLevel === 'high' || riskLevel === 'red') return { label: 'High', color: 'error' }
  if (riskLevel === 'medium' || riskLevel === 'yellow') return { label: 'Medium', color: 'warning' }
  // unknown or low risk will be treated as 'low level'
  return { label: 'Low', color: 'success' }
}

function getPersonalDataChip(source) {
  // This column replaced the older compliant flag and mirrors the backend classification.
  return source?.contains_personal_data
    ? { label: 'Yes', color: 'success' }
    : { label: 'No', color: 'default' }
}

function getArt9Chip(source) {
  if (hasArt9Data(source)) return { label: 'Yes', color: 'secondary' }
  if (source.art_9_data === 'no' || source.metadata?.art_9_data === 'no') return { label: 'No', color: 'default' }
  // unknown data will be labelled as default
  return { label: 'No', color: 'default' }
}

function getOverallRiskChip(status) {
  if (status === 'red') return { label: 'High Risk', color: 'error' }
  if (status === 'yellow') return { label: 'Medium Risk', color: 'warning' }
  return { label: 'Low Risk', color: 'success' }
}

function getSourceIcon(sourceType) {
  if (sourceType === 'database') return DatabaseFilled
  if (sourceType === 'api') return GlobalOutlined
  if (sourceType === 'manual') return FileTextOutlined
  return FileFilled
}

function HighRiskShieldIcon(props) {
  return (
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 3.5L22.25 6.6V13.05C22.25 18.25 18.92 22.96 14 24.5C9.08 22.96 5.75 18.25 5.75 13.05V6.6L14 3.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M14 9V15.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 19.25H14.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Art9Icon(props) {
  const { style, ...rest } = props

  return (
    <Typography
      component="span"
      aria-hidden="true"
      sx={{ fontSize: 32, lineHeight: 1, fontWeight: 700 }}
      style={style}
      {...rest}
    >
      §
    </Typography>
  )
}

function ProjectIcon({ project }) {
  const style = getProjectStyle(project)
  const Icon = project.icon || projectIconMap[style.key] || FolderFilled

  return (
    <Box
      sx={{
        width: 82,
        height: 82,
        borderRadius: 2,
        display: 'grid',
        placeItems: 'center',
        bgcolor: `${style.color}.main`,
        color: 'common.white',
        flexShrink: 0,
      }}
    >
      <Icon style={{ fontSize: 38 }} />
    </Box>
  )
}

function hasArt9Data(source) {
  return (
    ['possible', 'yes', true].includes(source.art_9_data) ||
    ['possible', 'yes', true].includes(source.metadata?.art_9_data) ||
    source.metadata?.contains_art9_data === true
  )
}

function isHighRisk(source) {
  return ['high', 'red'].includes(source.risk_level)
}

function isMediumRisk(source) {
  return ['medium', 'yellow'].includes(source.risk_level)
}

// icon design for detected data categories 
const dataCategoryDisplay = {
  contact_data: {
    label: 'Contact Data',
    description: 'Email addresses, phone numbers, postal addresses',
    icon: MailOutlined,
    color: '#1677ff',
    bg: '#e6f4ff',
    isArt9: false,
  },
  direct_identifiers: {
    label: 'Direct Identifiers',
    description: 'Names, ID numbers, employee IDs, passport numbers',
    icon: IdcardOutlined,
    color: '#08979c',
    bg: '#e6fffb',
    isArt9: false,
  },
  location_data: {
    label: 'Location Data',
    description: 'Addresses, cities, GPS coordinates, postcodes',
    icon: EnvironmentOutlined,
    color: '#722ed1',
    bg: '#f3e8ff',
    isArt9: false,
  },
  online_identifiers: {
    label: 'Online Identifiers',
    description: 'IP addresses, device IDs, cookies, session IDs',
    icon: GlobalOutlined,
    color: '#2563eb',
    bg: '#eff6ff',
    isArt9: false,
  },
  financial_data: {
    label: 'Financial Data',
    description: 'IBAN, credit card numbers, bank accounts, payments',
    icon: CreditCardOutlined,
    color: '#d48806',
    bg: '#fff7e6',
    isArt9: false,
  },
  health_data: {
    label: 'Health Data',
    description: 'Medical records, diagnoses, diseases, medications',
    icon: HeartFilled,
    color: '#ef4444',
    bg: '#fff1f0',
    isArt9: true,
  },
  biometric_genetic_data: {
    label: 'Biometric / Genetic Data',
    description: 'Fingerprints, facial recognition, DNA, genetic information',
    icon: ExperimentFilled,
    color: '#7c3aed',
    bg: '#f3e8ff',
    isArt9: true,
  },
  other_art_9_data: {
    label: 'Other Art. 9 Data',
    description: 'Political opinions, religion, sexual orientation, trade union',
    icon: SafetyCertificateFilled,
    color: '#7c3aed',
    bg: '#f3e8ff',
    isArt9: true,
  },
}

const dataCategoryOrder = Object.keys(dataCategoryDisplay)
const dataCategoryPriority = {
  health_data: 90,
  biometric_genetic_data: 90,
  other_art_9_data: 85,
  financial_data: 80,
  direct_identifiers: 75,
  contact_data: 70,
  location_data: 60,
  online_identifiers: 55,
}

function normalizeDataCategory(category) {
  const key = typeof category === 'string' ? category : category?.key
  if (!key || !dataCategoryDisplay[key]) return null

  return {
    key,
    ...dataCategoryDisplay[key],
    group: category?.group,
    is_art_9: category?.is_art_9,
    source_count: category?.source_count,
  }
}

// Reads data category keys from multiple metadata generations.
// New sources should provide data_category_keys;
// the fallbacks keep older or raw metadata records visible in 
// project-level category summaries.
function getSourceDataCategoryKeys(source) {
  const keys = source.metadata?.data_category_keys
  // the most common generation of matadata
  if (Array.isArray(keys)) {
    return keys.filter((key) => dataCategoryDisplay[key])
  }

  // QUESTION: Do we still need these 2 shapes from older versions below? 
  // Backward-compatible shape: some metadata may store full category objects
  // instead of just keys, e.g. { key, label, group, is_art_9 }.
  const categories = source.metadata?.data_categories
  if (Array.isArray(categories)) {
    return categories
      .map((category) => (typeof category === 'string' ? category : category?.key))
      .filter((key) => dataCategoryDisplay[key])
  }


  // Legacy/raw detection shape: infer display categories from the lower-level
  // detector outputs when normalized category fields are missing.
  const inferredKeys = new Set()
  const personalCategories = source.metadata?.personal_data_categories ?? []
  const art9Categories = source.metadata?.art_9_categories ?? []

  personalCategories.forEach((category) => {
    if (['email', 'phone', 'address'].includes(category)) inferredKeys.add('contact_data')
    if (['name', 'identifier', 'date_of_birth'].includes(category)) inferredKeys.add('direct_identifiers')
    if (['address', 'location'].includes(category)) inferredKeys.add('location_data')
    if (['ip_address', 'online_identifier'].includes(category)) inferredKeys.add('online_identifiers')
    if (category === 'financial') inferredKeys.add('financial_data')
  })

  art9Categories.forEach((category) => {
    if (category === 'health') inferredKeys.add('health_data')
    if (['biometric', 'genetic'].includes(category)) inferredKeys.add('biometric_genetic_data')
    if (['political_opinion', 'religion', 'sexual_orientation', 'trade_union'].includes(category)) inferredKeys.add('other_art_9_data')
  })

  return [...inferredKeys]
}

// counts how many data sources contain each normalized category and
// returns the backend-compatible summary shape used by the category card
function buildDetectedDataCategories(dataSources) {
  const counts = new Map()

  dataSources.forEach((source) => {
    getSourceDataCategoryKeys(source).forEach((key) => {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  })

  // iterate over the stable display order rather than Map insertion order
  // so the result remains predictable
  return dataCategoryOrder
    .filter((key) => counts.has(key))
    .map((key) => ({
      key,
      label: dataCategoryDisplay[key].label,
      group: dataCategoryDisplay[key].isArt9 ? 'art_9' : 'personal_data',
      is_art_9: dataCategoryDisplay[key].isArt9,
      source_count: counts.get(key),
    }))
}

// Sorts categories using three deterministic criteria:
// 1. Categories detected in more sources appear first.
// 2. Equal counts are resolved using business/privacy priority.
// 3. Remaining ties use the stable display order.
function sortDetectedDataCategories(categories) {
  return [...categories].sort((first, second) => {
    const countDiff = (second.source_count ?? 0) - (first.source_count ?? 0)
    if (countDiff !== 0) return countDiff

    const priorityDiff = (dataCategoryPriority[second.key] ?? 0) - (dataCategoryPriority[first.key] ?? 0)
    if (priorityDiff !== 0) return priorityDiff

    return dataCategoryOrder.indexOf(first.key) - dataCategoryOrder.indexOf(second.key)
  })
}

function buildRiskAssessmentFallback(dataSources) {
  // Local fallback keeps the overview usable while the backend risk endpoint is unavailable.
  const metrics = {
    total_data_sources: dataSources.length,
    personal_data_sources: dataSources.filter((source) => source.contains_personal_data === true).length,
    high_risk_sources: dataSources.filter(isHighRisk).length,
    medium_risk_sources: dataSources.filter(isMediumRisk).length,
    art_9_sources: dataSources.filter(hasArt9Data).length,
  }

  let overallStatus = 'green'
  let reason = 'No personal data or high-risk categories are currently detected.'
  const recommendations = ['Keep data source metadata documented and review it when sources change.']

  // Art. 9 data is treated like a high-risk source
  if (metrics.high_risk_sources > 0 || metrics.art_9_sources > 0) {
    overallStatus = 'red'
    reason = 'At least one data source is high risk or contains GDPR Art. 9 special category data.'
    recommendations.unshift('Review high-risk and Art. 9 data sources before model training.')
  } else if (metrics.personal_data_sources > 0 || metrics.medium_risk_sources > 0) {
    overallStatus = 'yellow'
    reason = 'At least one data source contains personal data or has medium risk level.'
    recommendations.unshift('Review legal basis for processing and minimize directly identifying attributes.')
  }

  return {
    overall_status: overallStatus,
    reason,
    metrics,
    top_detected_data_categories: buildDetectedDataCategories(dataSources),
    recommendations,
  }
}

function normalizeSampleDataSource(source) {
  const riskLevel = String(source.risk ?? '').toLowerCase()

  // Demo/cached project sources use older field names; normalize them before rendering tables and previews.
  return {
    contains_personal_data: source.personal_data === 'Yes' || source.personal === 'Yes',
    data_format_display: source.data_format_display ?? source.format ?? '-',
    risk_level: riskLevel || 'medium',
    risk_level_display: source.risk ?? 'Medium',
    source_type_display: source.source_type_display ?? source.type ?? 'File',
    metadata: source.metadata ?? {},
    ...source,
  }
}

// allows project details to appear immediately while the latest
// server response is still loading or temporarily unavailable
function buildLocalProjectOverview(projectId) {
  // Build the same shape as the API response from session cache for instant project-detail recovery.
  const projects = applyProjectStyleOverrides(readCachedProjects(), readProjectStyleOverrides())
  const project = projects.find((item) => String(item.id) === String(projectId))
  if (!project) return null

  // Route parameters are strings, while cached IDs may be numbers
  const dataSources = readCachedDataSources()
    .filter((source) => String(source.project) === String(projectId))
    .map(normalizeSampleDataSource)
  const riskAssessment = buildRiskAssessmentFallback(dataSources)

  return {
    project,
    data_sources: dataSources,
    risk_assessment: riskAssessment,
  }
}

function SummaryCard({ title, value, helper, color, icon: Icon, iconSx }) {
  return (
    <MainCard
      sx={{
        height: '100%',
        borderColor: `${color}.light`,
        bgcolor: `${color}.lighter`,
        '& .MuiCardContent-root': { height: '100%' },
      }}
    >
      <Box
        sx={{
          minHeight: 116,
          display: 'grid',
          gridTemplateColumns: '64px minmax(0, 1fr)',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
            flexShrink: 0,
            ...iconSx,
          }}
        >
          <Icon style={{ fontSize: 27 }} />
        </Box>
        <Stack spacing={0.75} sx={{ minWidth: 0, alignSelf: 'center' }}>
          <Typography variant="subtitle2" sx={{color:"common.black"}}>
            {title}
          </Typography>
          <Typography variant="h2" sx={{color:"common.black"}}>{value}</Typography>
          <Typography variant="body2" sx={{color:"common.black"}}>
            {helper}
          </Typography>
        </Stack>
      </Box>
    </MainCard>
  )
}

function RiskDistributionCard({ metrics }) {
  const high = metrics.high_risk_sources ?? 0
  const medium = metrics.medium_risk_sources ?? 0
  const total = Math.max(metrics.total_data_sources ?? high + medium, 0)
  const low = Math.max(total - high - medium, 0)
  const hasSources = total > 0
  const safeTotal = hasSources ? total : 1 // avoid division by zero while keeping all displayed percentages at zero
  const highDegrees = (high / safeTotal) * 360
  const mediumDegrees = (medium / safeTotal) * 360
  const highEnd = highDegrees
  const mediumEnd = highDegrees + mediumDegrees
  const riskGradient = hasSources
    ? `conic-gradient(#ef4444 0deg ${highEnd}deg, #f59e0b ${highEnd}deg ${mediumEnd}deg, #52c41a ${mediumEnd}deg 360deg)`
    : 'conic-gradient(#dbeafe 0deg 110deg, #eef2ff 110deg 245deg, #f1f5f9 245deg 360deg)'
  const distribution = [
    { label: 'High', value: high, color: '#ef4444', percent: Math.round((high / safeTotal) * 100) },
    { label: 'Medium', value: medium, color: '#f59e0b', percent: Math.round((medium / safeTotal) * 100) },
    { label: 'Low', value: low, color: '#52c41a', percent: Math.round((low / safeTotal) * 100) },
  ]

  return (
    <MainCard>
      <Stack spacing={1.5}>
        <Typography variant="h5">Risk Distribution</Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 112,
              height: 112,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: riskGradient,
              boxShadow: hasSources ? 'inset 0 0 0 1px rgba(0,0,0,0.04)' : 'inset 0 0 0 1px #dbeafe',
              flexShrink: 0,
              opacity: hasSources ? 1 : 0.95,
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 1px 8px rgba(15, 23, 42, 0.08)',
              }}
            >
              <Typography variant={hasSources ? 'h4' : 'h5'} sx={{ lineHeight: 1.1 }}>
                {total}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, mt: 0.25 }}>
                {hasSources ? 'Total' : 'Sources'}
              </Typography>
            </Box>
          </Box>
          <Stack spacing={1.05} sx={{ flex: 1 }}>
            {distribution.map((item) => (
              <Stack key={item.label} direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color }} />
                  <Typography variant="body2">{item.label}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {hasSources ? `${item.percent}% (${item.value})` : '0 sources'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
        {!hasSources && (
          <Box
            sx={{
              borderRadius: 1,
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
              px: 1.5,
              py: 1.25,
            }}
          >
            <Typography variant="body2">
              Add data sources to calculate risk distribution.
            </Typography>
          </Box>
        )}
      </Stack>
    </MainCard>
  )
}

function DataCategoryCard({ categories }) {
  const detectedCategories = sortDetectedDataCategories(categories.map(normalizeDataCategory).filter(Boolean))
  const visibleCategories = detectedCategories.slice(0, 5)
  const hiddenCategoryCount = Math.max(detectedCategories.length - visibleCategories.length, 0)

  return (
    <MainCard>
      <Stack spacing={1.35}>
        <Typography variant="h5">Top Detected Data Categories</Typography>
        {detectedCategories.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No data categories detected yet.
          </Typography>
        )}
        {visibleCategories.map((category) => {
          const Icon = category.icon

          return (
            <Box
              key={category.key}
              sx={{
                display: 'grid',
                gridTemplateColumns: '32px minmax(0, 1fr) 92px',
                columnGap: 1.25,
                alignItems: 'center',
                borderRadius: 1,
                minHeight: 58,
                py: 0.65,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  color: category.color,
                  bgcolor: category.bg,
                }}
              >
                <Icon style={{ fontSize: 17 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>{category.label}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                  }}
                >
                  {category.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
                {Number.isFinite(category.source_count) && (
                  <Chip
                    label={`${category.source_count} ${category.source_count === 1 ? 'source' : 'sources'}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      minWidth: 74,
                      maxWidth: 92,
                      color: category.color,
                      borderColor: category.color,
                      bgcolor: category.bg,
                      '& .MuiChip-label': {
                        px: 0.75,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          )
        })}
        {hiddenCategoryCount > 0 && (
          <Box
            sx={{
              borderRadius: 1,
              bgcolor: 'grey.100',
              border: '1px dashed',
              borderColor: 'divider',
              px: 1.5,
              py: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              +{hiddenCategoryCount} more categories detected
            </Typography>
          </Box>
        )}
      </Stack>
    </MainCard>
  )
}
function RiskRecommendationsCard({ status, recommendations }) {
  const shouldShowRecommendations =
      status === 'yellow' || status === 'red'

  if (
      !shouldShowRecommendations ||
      !Array.isArray(recommendations) ||
      recommendations.length === 0
  ) {
    return null
  }

  const severity = status === 'red' ? 'error' : 'warning'
  const title =
      status === 'red'
          ? 'High Risk Recommendations'
          : 'Medium Risk Recommendations'

  return (
      <MainCard>
        <Stack spacing={1.5}>
          <Alert severity={severity} variant="outlined">
            <Typography variant="h5" sx={{ mb: 0.75 }}>
              {title}
            </Typography>

            <Typography variant="body2">
              Follow these actions to reduce the project risk before continuing.
            </Typography>
          </Alert>

          <Stack component="ul" spacing={1} sx={{ pl: 2.5, mb: 0 }}>
            {recommendations.map((recommendation) => (
                <Typography
                    component="li"
                    variant="body2"
                    key={recommendation}
                >
                  {recommendation}
                </Typography>
            ))}
          </Stack>
        </Stack>
      </MainCard>
  )
}

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [dataSources, setDataSources] = useState([])
  const [riskAssessment, setRiskAssessment] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [deletingDataSourceId, setDeletingDataSourceId] = useState(null)
  const [dataSourcePendingDelete, setDataSourcePendingDelete] = useState(null)
  const [dataSourcePendingPreview, setDataSourcePendingPreview] = useState(null)
  const [dataSourcePendingHistory, setDataSourcePendingHistory] = useState(null)
  const [editingProject, setEditingProject] = useState(false)
  const [editForm, setEditForm] = useState(initialEditForm)
  const [savingProject, setSavingProject] = useState(false)

  useEffect(() => {
    // Prevent asynchronous callbacks from updating state after the component
    // has unmounted or projectId has changed.
    let isActive = true
    const localOverview = buildLocalProjectOverview(projectId)

    // defer the local state update until after the current effect setup
    // avoid performing synchronous state updates directly inside the effect
    queueMicrotask(() => {
      if (!isActive) return

      if (localOverview) {
        setProject(localOverview.project)
        setDataSources(localOverview.data_sources)
        setRiskAssessment(localOverview.risk_assessment)
        setPage(0)
        setLoading(false)
        setError('')
        setNotFound(false)
      } else {
        setProject(null)
        setDataSources([])
        setRiskAssessment(null)
        setLoading(true)
        setError('')
        setNotFound(false)
      }
    })

    getProjectOverview(projectId)
      .then((overview) => {
        if (!isActive) return

        setProject(applyProjectStyleOverrides([overview.project], readProjectStyleOverrides())[0])
        setDataSources(overview.data_sources ?? [])
        setRiskAssessment(overview.risk_assessment ?? null)
        writeCachedProjects([overview.project, ...readCachedProjects().filter((cachedProject) => cachedProject.id !== overview.project.id)])
        writeCachedDataSources([
          ...(overview.data_sources ?? []),
          ...readCachedDataSources().filter((cachedSource) => String(cachedSource.project) !== String(projectId)),
        ])
        setPage(0)
        setError('')
        setNotFound(false)
      })
      .catch((loadError) => {
        if (isActive) {
          if (localOverview) {
            setError('')
          } else if (loadError?.status === 404) {
            setNotFound(true)
            setError('Project not found.')
          } else {
            setError('Could not load project details. Please check the backend connection and try again.')
          }
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      // ignore any pending API result after cleanup
      isActive = false
    }
  }, [projectId])

  async function confirmDeleteDataSource() {
    if (!dataSourcePendingDelete) return

    const sourceToDelete = dataSourcePendingDelete
    const previousDataSources = dataSources

    setDeletingDataSourceId(sourceToDelete.id)
    setDataSourcePendingDelete(null)
    setDataSources((currentSources) => currentSources.filter((source) => source.id !== sourceToDelete.id))
    setError('')

    try {
      await deleteDataSource(sourceToDelete.project, sourceToDelete.id)
      const overview = await getProjectOverview(projectId)
      setProject(overview.project)
      setDataSources(overview.data_sources ?? [])
      setRiskAssessment(overview.risk_assessment ?? null)
      setPage(0)
    } catch {
      setDataSources(previousDataSources)
      setError('Could not delete data source. Please try again.')
    } finally {
      setDeletingDataSourceId(null)
    }
  }

  function openEditProjectDialog() {
    setEditForm({
      name: project?.name ?? '',
      description: project?.description ?? '',
      icon_key: getProjectStyle(project).key,
      color: getProjectStyle(project).color,
    })
    setEditingProject(true)
  }

  function closeEditProjectDialog() {
    setEditingProject(false)
    setEditForm(initialEditForm)
    setSavingProject(false)
  }

  async function handleSaveProject(event) {
    event.preventDefault()

    if (!project || !editForm.name.trim()) return

    setSavingProject(true)
    setError('')

    try {
      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      }
      const styleData = {
        icon_key: editForm.icon_key,
        color: editForm.color,
      }
      const updatedProject = {
        ...(await updateProject(project.id, updateData)),
        ...styleData,
      }

      setProject(updatedProject)
      writeProjectStyleOverride(updatedProject.id, styleData)

      const cachedProjects = readCachedProjects()
      const nextCachedProjects = cachedProjects.some((cachedProject) => cachedProject.id === updatedProject.id)
        ? cachedProjects.map((cachedProject) => (cachedProject.id === updatedProject.id ? updatedProject : cachedProject))
        : [updatedProject, ...cachedProjects]
      writeCachedProjects(nextCachedProjects)

      closeEditProjectDialog()
    } catch {
      setError('Could not update the project. Please check the form and try again.')
      setSavingProject(false)
    }
  }

  const filteredDataSources = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return dataSources

    return dataSources.filter((source) => {
      const fields = [
        source.name,
        source.description,
        source.location,
        source.source_type_display,
        source.data_format_display,
        source.risk_level_display,
        source.art_9_data_display,
      ]
      return fields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [dataSources, search])

  // prefer the backend assessment. Build a local result only when the API
  // response or cached overview does not contain one.
  const effectiveRiskAssessment = useMemo(
    () => riskAssessment ?? buildRiskAssessmentFallback(dataSources),
    [dataSources, riskAssessment],
  )
  const metrics = effectiveRiskAssessment.metrics ?? {}
  const detectedDataCategories = effectiveRiskAssessment.top_detected_data_categories ?? buildDetectedDataCategories(dataSources)
  const overallRisk = getOverallRiskChip(effectiveRiskAssessment.overall_status)
  const rowsPerPage = 10

  const visibleDataSources = useMemo(
    () => filteredDataSources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredDataSources, page, rowsPerPage],
  )
  const summaryCards = [
    {
      title: 'Total Sources',
      value: metrics.total_data_sources ?? dataSources.length,
      helper: 'Across all source types',
      color: 'primary',
      icon: DatabaseFilled,
    },
    {
      title: 'Personal Data',
      value: metrics.personal_data_sources ?? dataSources.filter((source) => source.contains_personal_data).length,
      helper: 'Sources contain personal data',
      color: 'success',
      icon: UserOutlined,
    },
    {
      title: 'High Risk',
      value: metrics.high_risk_sources ?? dataSources.filter((source) => source.risk_level === 'high').length,
      helper: 'High risk data sources',
      color: 'error',
      icon: WarningFilled,
    },
    {
      title: 'Medium Risk',
      value: metrics.medium_risk_sources ?? dataSources.filter(isMediumRisk).length,
      helper: 'Sources needing review',
      color: 'warning',
      icon: WarningFilled,
    },
    {
      title: 'Art. 9 Data',
      value: metrics.art_9_sources ?? dataSources.filter((source) => ['possible', 'yes'].includes(source.art_9_data)).length,
      helper: 'Special category data',
      color: 'success',
      icon: Art9Icon,
      iconSx: {
        bgcolor: '#f0e7ff',
        color: '#7c3aed',
      },
    },
  ]

  return (
    <Stack spacing={3}>
      <Stack spacing={2.5}>
        <Button
          component={RouterLink}
          to="/projects"
          startIcon={<LeftOutlined />}
          sx={{ alignSelf: 'flex-start', px: 0 }}
        >
          Back to Projects
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Loading project details...</Alert>}

      {!loading && notFound && (
        <Button variant="contained" component={RouterLink} to="/projects" sx={{ alignSelf: 'flex-start' }}>
          Back to Projects
        </Button>
      )}

      {!loading && project && (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={3} sx={{ alignItems: 'center', minWidth: 0 }}>
              <ProjectIcon project={project} />
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 34 }, overflowWrap: 'anywhere' }}>
                  {project.name}
                </Typography>
                <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {project.description || 'No description provided.'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <CalendarOutlined />
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDate(project.created_at)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <ClockCircleOutlined />
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: {formatDate(project.updated_at)}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <ProjectPdfExportButton
                project={project}
                dataSources={dataSources}
                riskAssessment={riskAssessment}
              />
              <Button variant="outlined" startIcon={<EditOutlined />} onClick={openEditProjectDialog} sx={{ minWidth: 150 }}>
                Edit Project
              </Button>
              <Button
                variant="contained"
                startIcon={<PlusCircleFilled />}
                onClick={() => navigate(`/data-sources/new?project=${project.id}&returnTo=project`)}
                sx={{ minWidth: 180 }}
              >
                Add Data Source
              </Button>
            </Stack>
          </Stack>

          <MainCard sx={{ borderColor: 'divider' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: `${overallRisk.color}.lighter`,
                    color: `${overallRisk.color}.main`,
                    flexShrink: 0,
                  }}
                >
                  <HighRiskShieldIcon />
                </Box>
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="h5">Overall Risk:</Typography>
                    <Chip label={overallRisk.label.replace(' Risk', '')} color={overallRisk.color} variant="outlined" />
                  </Stack>
                  <Typography color="text.secondary">
                    {effectiveRiskAssessment.reason || 'Risk assessment is not available yet.'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </MainCard>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {summaryCards.map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 360px' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <MainCard content={false}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', px: 2, py: 2 }}
              >
                <Typography variant="h5">Data Sources</Typography>
                <OutlinedInput
                  size="small"
                  placeholder="Search data sources..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(0)
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                  endAdornment={
                    search ? (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label="Clear data source search"
                          onClick={() => {
                            setSearch('')
                            setPage(0)
                          }}
                        >
                          <CloseOutlined />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                  sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'background.paper' }}
                />
              </Stack>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1280,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': { py: 1.05 },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      py: 1.15,
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                    },
                  }}
                  aria-label="Project data sources table"
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 280 }}>Source Name</TableCell>
                      <TableCell sx={{ width: 130 }}>Type</TableCell>
                      <TableCell sx={{ width: 130 }}>Format</TableCell>
                      <TableCell sx={{ width: 115 }}>Risk</TableCell>
                      <TableCell sx={{ width: 135 }}>Personal Data</TableCell>
                      <TableCell sx={{ width: 115 }}>Art. 9</TableCell>
                      <TableCell sx={{ width: 105 }}>Version</TableCell>
                      <TableCell sx={{ width: 150 }}>Last Updated</TableCell>
                      <TableCell align="right" sx={{ width: 180 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDataSources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {dataSources.length === 0 ? 'No data sources added yet.' : 'No data sources match your search.'}
                            </Typography>
                            {dataSources.length === 0 ? (
                              <Button
                                variant="contained"
                                startIcon={<PlusCircleFilled />}
                                // Project context keeps the add flow from bouncing back to the global list.
                                onClick={() => navigate(`/data-sources/new?project=${project.id}&returnTo=project`)}
                              >
                                Add Data Source
                              </Button>
                            ) : (
                              <Button color="secondary" onClick={() => setSearch('')}>
                                Clear Search
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}

                    {visibleDataSources.map((source) => {
                      const SourceIcon = getSourceIcon(source.source_type)
                      const riskChip = getRiskChip(source.risk_level)
                      // Personal Data is intentionally shown beside risk so users can inspect the risk basis.
                      const personalDataChip = getPersonalDataChip(source)
                      const art9Chip = getArt9Chip(source)

                      return (
                        <TableRow
                          key={source.id}
                          hover
                          tabIndex={0}
                          // Row activation and the preview icon share the same dataset preview dialog.
                          onClick={() => setDataSourcePendingPreview(source)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setDataSourcePendingPreview(source)
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, width: '100%' }}>
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  display: 'grid',
                                  placeItems: 'center',
                                  bgcolor: source.source_type === 'database' ? 'success.lighter' : 'primary.lighter',
                                  color: source.source_type === 'database' ? 'success.main' : 'primary.main',
                                  flexShrink: 0,
                                }}
                              >
                                <SourceIcon />
                              </Box>
                              <Typography
                                variant="subtitle2"
                                title={source.name}
                                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {source.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={source.source_type_display}
                              color="primary"
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={source.data_format_display}
                              color="secondary"
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={riskChip.label} color={riskChip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={personalDataChip.label} color={personalDataChip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={art9Chip.label} color={art9Chip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`v${source.current_version_number ?? 1}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{formatDate(source.updated_at)}</TableCell>
                          <TableCell
                            align="right"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                              <Tooltip title="View version history">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label={`Version history ${source.name}`}
                                    onClick={() => setDataSourcePendingHistory(source)}
                                  >
                                    <HistoryOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Preview data source">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label={`Preview ${source.name}`}
                                    onClick={() => setDataSourcePendingPreview(source)}
                                  >
                                    <EyeOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Edit data source">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label={`Edit ${source.name}`}
                                    onClick={() => {
                                      // Keep edits scoped to this project detail page on save/cancel.
                                      navigate(`/data-sources/${source.id}/edit?project=${source.project}&returnTo=project`)
                                    }}
                                  >
                                    <EditOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete data source">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label={`Delete ${source.name}`}
                                    disabled={deletingDataSourceId === source.id}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setDataSourcePendingDelete(source)
                                    }}
                                  >
                                    <DeleteOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredDataSources.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                labelRowsPerPage=""
                onPageChange={(_, nextPage) => setPage(nextPage)}
              />
            </MainCard>
            <Stack spacing={2}>
              <RiskRecommendationsCard
                  status={effectiveRiskAssessment.overall_status}
                  recommendations={effectiveRiskAssessment.recommendations}
              />

              <RiskDistributionCard metrics={metrics} />

              <DataCategoryCard categories={detectedDataCategories} />
            </Stack>
          </Box>

          <DatasetPreviewDialog
            source={dataSourcePendingPreview}
            onClose={() => setDataSourcePendingPreview(null)}
            onOpenProject={() => setDataSourcePendingPreview(null)}
            onEdit={() => {
              // Capture the source before closing because close clears the preview state.
              const source = dataSourcePendingPreview
              setDataSourcePendingPreview(null)
              navigate(`/data-sources/${source.id}/edit?project=${source.project}&returnTo=project`)
            }}
          />

          <DataSourceVersionHistoryDialog
            open={Boolean(dataSourcePendingHistory)}
            source={dataSourcePendingHistory}
            onClose={() => setDataSourcePendingHistory(null)}
          />
          <Dialog
            open={Boolean(dataSourcePendingDelete)}
            onClose={() => setDataSourcePendingDelete(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Delete &quot;{dataSourcePendingDelete?.name}&quot; from this project? The project metrics and risk assessment will update immediately after deletion.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button color="secondary" onClick={() => setDataSourcePendingDelete(null)}>
                Cancel
              </Button>
              <Button
                color="error"
                variant="contained"
                disabled={Boolean(deletingDataSourceId)}
                onClick={confirmDeleteDataSource}
              >
                {deletingDataSourceId ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={editingProject} onClose={closeEditProjectDialog} fullWidth maxWidth="sm">
            <Box component="form" onSubmit={handleSaveProject}>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                    label="Project Name"
                    required
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <TextField
                    label="Description"
                    multiline
                    minRows={3}
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Project Icon</Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                        gap: 1,
                      }}
                    >
                      {projectIconOptions.map((option) => {
                        const Icon = projectIconMap[option.key] ?? FolderFilled
                        const selected = editForm.icon_key === option.key

                        return (
                          <Button
                            key={option.key}
                            type="button"
                            variant={selected ? 'outlined' : 'text'}
                            color={selected ? 'primary' : 'secondary'}
                            onClick={() => setEditForm((current) => ({ ...current, icon_key: option.key }))}
                            sx={{
                              minHeight: 72,
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: `${editForm.color}.main`,
                                color: 'common.white',
                              }}
                            >
                              <Icon />
                            </Box>
                            {option.label}
                          </Button>
                        )
                      })}
                    </Box>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Background Color</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      {projectColorOptions.map((option) => {
                        const selected = editForm.color === option.key

                        return (
                          <Button
                            key={option.key}
                            type="button"
                            variant={selected ? 'contained' : 'outlined'}
                            color={option.key}
                            onClick={() => setEditForm((current) => ({ ...current, color: option.key }))}
                            startIcon={
                              <Box
                                component="span"
                                sx={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  bgcolor: `${option.key}.main`,
                                  border: '1px solid',
                                  borderColor: selected ? 'common.white' : `${option.key}.main`,
                                }}
                              />
                            }
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </Stack>
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button type="button" color="secondary" onClick={closeEditProjectDialog}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={savingProject || !editForm.name.trim()}>
                  {savingProject ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogActions>
            </Box>
          </Dialog>
        </>
      )}
    </Stack>
  )
}
