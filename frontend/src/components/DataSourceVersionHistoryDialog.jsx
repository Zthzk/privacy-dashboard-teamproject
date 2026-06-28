import React, { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  CheckCircleOutlined,
  CloseOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import { getDataSourceVersions } from 'api/dataSources'
import { getComplianceFindings, getDataSourcePreviewText } from 'utils/data-source-preview'

function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function titleCase(value) {
  if (!value) return '-'

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getRiskChip(riskLevel) {
  if (riskLevel === 'high' || riskLevel === 'red') return { label: 'High', color: 'error' }
  if (riskLevel === 'medium' || riskLevel === 'yellow') return { label: 'Medium', color: 'warning' }
  return { label: 'Low', color: 'success' }
}

function getArt9Value(source) {
  return source?.art_9_data ?? source?.metadata?.art_9_data ?? 'unknown'
}

function getArt9Chip(source) {
  const value = getArt9Value(source)
  if (value === 'possible') return { label: 'Possible', color: 'warning' }
  if (value === 'yes') return { label: 'Yes', color: 'error' }
  if (value === 'no') return { label: 'No', color: 'default' }
  return { label: titleCase(value), color: 'default' }
}

function getPrivacyStatus(version) {
  return {
    risk: version?.risk_level ?? 'low',
    personalData: Boolean(version?.contains_personal_data),
    art9: getArt9Value(version),
    findings: getComplianceFindings(version).length,
  }
}

function buildChangeItems(selectedVersion, previousVersion) {
  if (!selectedVersion || !previousVersion) return []

  const current = getPrivacyStatus(selectedVersion)
  const previous = getPrivacyStatus(previousVersion)
  const changes = []

  if (current.risk !== previous.risk) {
    changes.push({
      label: 'Risk level',
      before: titleCase(previous.risk),
      after: titleCase(current.risk),
    })
  }

  if (current.personalData !== previous.personalData) {
    changes.push({
      label: 'Personal data',
      before: previous.personalData ? 'Yes' : 'No',
      after: current.personalData ? 'Yes' : 'No',
    })
  }

  if (current.art9 !== previous.art9) {
    changes.push({
      label: 'Art. 9 data',
      before: titleCase(previous.art9),
      after: titleCase(current.art9),
    })
  }

  if (current.findings !== previous.findings) {
    changes.push({
      label: 'Compliance findings',
      before: String(previous.findings),
      after: String(current.findings),
    })
  }

  return changes
}

function StatusMetric({ label, children }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  )
}

function SnapshotPanel({ title, icon: Icon, children }) {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
          <Typography variant="h5">{title}</Typography>
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}

export default function DataSourceVersionHistoryDialog({ source, open, onClose }) {
  const [versions, setVersions] = useState([])
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Prevent state updates after the dialog was closed or the component was unmounted
  // avoids React warnings and prevents outdated API responses from overwriting newer state
  useEffect(() => {
    let isActive = true

    if (!open || !source) {
      return () => {
        isActive = false
      }
    }

    queueMicrotask(() => {
      if (!isActive) return
      setVersions([])
      setSelectedVersionNumber(null)
      setLoading(true)
      setError('')
    })

    getDataSourceVersions(source.project, source.id)
      .then((versionList) => {
        if (!isActive) return

        const nextVersions = Array.isArray(versionList) ? versionList : []
        setVersions(nextVersions)
        setSelectedVersionNumber(nextVersions[0]?.version_number ?? null)
      })
      .catch(() => {
        if (isActive) {
          setVersions([])
          setSelectedVersionNumber(null)
          setError('Could not load data source versions. Please try again.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [open, source])

  // Select the version that is currently shown in the detail panel
  // The previous version is taken from the next item because the API returns newest versions first
  const selectedIndex = versions.findIndex((version) => version.version_number === selectedVersionNumber)
  const selectedVersion = selectedIndex >= 0 ? versions[selectedIndex] : null
  const previousVersion = selectedIndex >= 0 ? versions[selectedIndex + 1] : null
  
  // Memoize the comparison result because it only needs to be recalculated
  // when the selected version or its previous version changes
  const changeItems = useMemo(
    () => buildChangeItems(selectedVersion, previousVersion),
    [selectedVersion, previousVersion],
  )
  const previewText = getDataSourcePreviewText(selectedVersion)
  const riskChip = getRiskChip(selectedVersion?.risk_level)
  const art9Chip = getArt9Chip(selectedVersion)
  const complianceFindings = getComplianceFindings(selectedVersion)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': 'Version History',
          sx: {
            borderRadius: 2,
            maxWidth: 1080,
            width: 'calc(100% - 48px)',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 3, sm: 3.5 }, pt: 2.5, pb: 1, pr: 7 }}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <HistoryOutlined aria-hidden="true" />
            <Typography component="span" variant="h4">
              Version History
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {source?.name ?? 'Data source'} {source?.current_version_number ? `is currently on version ${source.current_version_number}` : ''}
          </Typography>
        </Stack>
      </DialogTitle>
      <IconButton
        aria-label="Close version history"
        onClick={onClose}
        sx={{ position: 'absolute', right: 20, top: 20 }}
      >
        <CloseOutlined />
      </IconButton>
      <DialogContent dividers sx={{ px: { xs: 3, sm: 3.5 }, py: 2.5, bgcolor: 'grey.50' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading version history...</Alert>}

        {!loading && !error && versions.length === 0 && (
          <Box
            sx={{
              minHeight: 220,
              display: 'grid',
              placeItems: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Typography color="text.secondary">No version history is available for this data source.</Typography>
          </Box>
        )}

        {versions.length > 0 && selectedVersion && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5">Versions</Typography>
              </Box>
              <Stack component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {versions.map((version) => {
                  const versionRisk = getRiskChip(version.risk_level)
                  const selected = version.version_number === selectedVersionNumber

                  return (
                    <Box component="li" key={version.version_number}>
                      <Button
                        fullWidth
                        color="secondary"
                        aria-label={`Select version ${version.version_number}`}
                        onClick={() => setSelectedVersionNumber(version.version_number)}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          borderRadius: 0,
                          px: 2,
                          py: 1.35,
                          bgcolor: selected ? 'primary.lighter' : 'background.paper',
                          borderLeft: '4px solid',
                          borderLeftColor: selected ? 'primary.main' : 'transparent',
                          '&:hover': { bgcolor: selected ? 'primary.lighter' : 'grey.50' },
                        }}
                      >
                        <Stack spacing={0.75} sx={{ width: '100%', minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">Version {version.version_number}</Typography>
                            <Chip size="small" label={versionRisk.label} color={versionRisk.color} variant="outlined" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(version.created_at)}
                          </Typography>
                        </Stack>
                      </Button>
                    </Box>
                  )
                })}
              </Stack>
            </Box>

            <Stack spacing={2}>
              <SnapshotPanel title={`Version ${selectedVersion.version_number} Snapshot`} icon={DatabaseOutlined}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  <StatusMetric label="Source type">
                    <Chip size="small" label={selectedVersion.source_type_display ?? titleCase(selectedVersion.source_type)} variant="outlined" />
                  </StatusMetric>
                  <StatusMetric label="Data format">
                    <Chip size="small" label={selectedVersion.data_format_display ?? titleCase(selectedVersion.data_format)} variant="outlined" />
                  </StatusMetric>
                  <StatusMetric label="Created">
                    <Typography variant="body2">{formatDateTime(selectedVersion.created_at)}</Typography>
                  </StatusMetric>
                  <StatusMetric label="Source location">
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere', textAlign: 'right' }}>
                      {selectedVersion.location || '-'}
                    </Typography>
                  </StatusMetric>
                </Box>
              </SnapshotPanel>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(300px, 0.82fr)' },
                  gap: 2,
                }}
              >
                <SnapshotPanel title="Source Data Snapshot" icon={FileSearchOutlined}>
                  {previewText ? (
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        height: 150,
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'common.white',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {previewText}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 150,
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'common.white',
                      }}
                    >
                      <Typography color="text.secondary">No manual data snapshot stored for this version.</Typography>
                    </Box>
                  )}
                </SnapshotPanel>

                <SnapshotPanel title="Privacy Status" icon={SecurityScanOutlined}>
                  <Stack spacing={0.25}>
                    <StatusMetric label="Risk level">
                      <Chip size="small" label={riskChip.label} color={riskChip.color} sx={{ minWidth: 78, fontWeight: 700 }} />
                    </StatusMetric>
                    <StatusMetric label="Personal data">
                      <Chip
                        size="small"
                        label={selectedVersion.contains_personal_data ? 'Yes' : 'No'}
                        color={selectedVersion.contains_personal_data ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </StatusMetric>
                    <StatusMetric label="Art. 9 data">
                      <Chip size="small" label={art9Chip.label} color={art9Chip.color} variant="outlined" />
                    </StatusMetric>
                    <StatusMetric label="Compliance findings">
                      <Chip size="small" label={complianceFindings.length} variant="outlined" />
                    </StatusMetric>
                  </Stack>
                </SnapshotPanel>
              </Box>

              <SnapshotPanel title="Privacy Status Changes" icon={changeItems.length > 0 ? WarningOutlined : CheckCircleOutlined}>
                {!previousVersion ? (
                  <Typography variant="body2" color="text.secondary">
                    This is the first stored version, so there is no earlier privacy status to compare.
                  </Typography>
                ) : changeItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No tracked privacy status fields changed compared with version {previousVersion.version_number}.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {changeItems.map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '150px minmax(0, 1fr)' },
                          gap: 1,
                          alignItems: 'center',
                          py: 1,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="subtitle2">{item.label}</Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <Chip size="small" label={item.before} variant="outlined" />
                          <Typography variant="body2" color="text.secondary">to</Typography>
                          <Chip size="small" label={item.after} color="primary" />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </SnapshotPanel>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 3, sm: 3.5 }, py: 2 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
