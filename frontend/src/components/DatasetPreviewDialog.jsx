import React, { useState } from 'react'

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
  AudioOutlined,
  CloseOutlined,
  EditOutlined,
  ExportOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  RightOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons'

import { getComplianceFindings, getDataSourcePreviewText } from 'utils/data-source-preview'

// Keep the inline card compact; the popup exposes the full selected findings list.
const PREVIEW_FINDINGS_LIMIT = 3

function getRiskChip(riskLevel) {
  if (riskLevel === 'high' || riskLevel === 'red') return { label: 'High Risk', color: 'error', severity: 83.3 }
  if (riskLevel === 'medium' || riskLevel === 'yellow') return { label: 'Medium Risk', color: 'warning', severity: 50 }
  return { label: 'Low Risk', color: 'success', severity: 16.7 }
}

function titleCase(value) {
  if (!value) return '-'

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getArt9Display(source) {
  return titleCase(source?.art_9_data ?? source?.metadata?.art_9_data)
}

function getArt9Color(value) {
  if (String(value).toLowerCase() === 'possible') return 'warning'
  if (String(value).toLowerCase() === 'yes') return 'error'
  return 'default'
}

function PreviewPanel({ icon: Icon, title, children, sx }) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.25 },
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)',
        ...sx,
      }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {Icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                flexShrink: 0,
                '& svg': { fontSize: 18 },
              }}
            >
              <Icon />
            </Box>
          )}
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}

function RiskSeverityBar({ riskChip }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 0.25 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 112 }}>
        Risk severity
      </Typography>
      {/* The marker sits over a segmented scale to mirror the mockup without adding chart dependencies. */}
      <Box sx={{ position: 'relative', flex: 1, height: 20, display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #2eb64f 0 33%, #ffb020 33% 66%, #ff4d4f 66% 100%)',
          }}
        />
        <Box
          data-testid="risk-severity-marker"
          data-severity-position={String(riskChip.severity)}
          sx={{
            position: 'absolute',
            left: `${riskChip.severity}%`,
            transform: 'translateX(-50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            bgcolor: `${riskChip.color}.main`,
            border: '3px solid',
            borderColor: 'background.paper',
            boxShadow: `0 0 0 2px ${riskChip.color === 'error' ? '#ff4d4f' : riskChip.color === 'warning' ? '#ffb020' : '#2eb64f'}`,
          }}
        />
      </Box>
    </Stack>
  )
}

function RiskRow({ label, children }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.15,
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

function ComplianceFindingsList({ findings }) {
  // Use one list renderer for the card and popup so bullet alignment cannot drift.
  return (
    <Stack component="ul" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {findings.map((finding) => (
        <Box
          component="li"
          key={finding}
          sx={{
            display: 'grid',
            gridTemplateColumns: '12px minmax(0, 1fr)',
            columnGap: 1.5,
            alignItems: 'start',
          }}
        >
          <Box
            aria-hidden="true"
            data-testid="compliance-finding-marker"
            data-marker-tone="neutral"
            sx={{
              width: 7,
              height: 7,
              mt: '0.55em',
              borderRadius: '50%',
              bgcolor: 'grey.400',
              justifySelf: 'center',
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}>
            {finding}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default function DatasetPreviewDialog({ source, onClose, onEdit, onOpenProject }) {
  const [findingsPopupOpen, setFindingsPopupOpen] = useState(false)
  const previewText = getDataSourcePreviewText(source)
  const riskChip = getRiskChip(source?.risk_level)
  const complianceFindings = getComplianceFindings(source)
  const containsPersonalData = Boolean(source?.contains_personal_data)
  // Split findings into the visible teaser list and hidden items opened from the popup.
  const visibleFindings = complianceFindings.slice(0, PREVIEW_FINDINGS_LIMIT)
  const hiddenFindingsCount = complianceFindings.length - PREVIEW_FINDINGS_LIMIT

  function handleClose() {
    setFindingsPopupOpen(false)
    onClose()
  }

  return (
    <Dialog
      open={Boolean(source)}
      onClose={handleClose}
      aria-labelledby="dataset-preview-title"
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            maxWidth: 1060,
            width: 'calc(100% - 48px)',
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
          },
        },
      }}
    >
      <DialogTitle
        id="dataset-preview-title"
        sx={{ px: { xs: 3, sm: 3.5 }, pt: { xs: 2.25, sm: 2.5 }, pb: 0.5, pr: 8, fontSize: { xs: '1.5rem', sm: '1.85rem' }, fontWeight: 800 }}
      >
        Dataset Preview
      </DialogTitle>
      <Box sx={{ px: { xs: 3, sm: 3.5 }, pb: 1.75 }}>
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary">
            {source?.name ?? 'Untitled data source'} &middot; {source?.location || 'No source location provided'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              icon={<FileTextOutlined />}
              label={source?.source_type_display ?? source?.source_type ?? '-'}
              sx={{ px: 0.5, fontWeight: 600, bgcolor: 'primary.lighter' }}
            />
            <Chip
              size="small"
              variant="outlined"
              color="secondary"
              icon={<AudioOutlined />}
              label={source?.data_format_display ?? source?.data_format ?? '-'}
              sx={{ px: 0.5, fontWeight: 600 }}
            />
            <Chip
              size="small"
              variant="outlined"
              color={riskChip.color}
              icon={<SecurityScanOutlined />}
              label={riskChip.label}
              sx={{ px: 0.5, fontWeight: 600, bgcolor: `${riskChip.color}.lighter` }}
            />
          </Stack>
        </Stack>
      </Box>
      <IconButton
        aria-label="Close dataset preview"
        onClick={handleClose}
        sx={{ position: 'absolute', right: 24, top: 24 }}
      >
        <CloseOutlined />
      </IconButton>
      <DialogContent dividers sx={{ px: { xs: 3, sm: 3.5 }, py: 2.25, bgcolor: 'grey.50' }}>
        {/* Keep the preview layout shared so project and global data-source views stay visually consistent. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(320px, 0.85fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <PreviewPanel icon={FileSearchOutlined} title="Source Data Snapshot" sx={{ minHeight: 190 }}>
            {previewText ? (
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 120, sm: 140 },
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'common.white',
                  overflow: 'hidden',
                }}
              >
                {/* Keep long source samples inside this compact pane so the dialog remains scannable. */}
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: { xs: 2, sm: 2.5 },
                    height: '100%',
                    overflow: 'auto',
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {previewText}
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  height: { xs: 120, sm: 140 },
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'common.white',
                }}
              >
                <Typography color="text.secondary">No preview available for this data source.</Typography>
              </Box>
            )}
          </PreviewPanel>

          <Stack spacing={2}>
            <PreviewPanel icon={SecurityScanOutlined} title="Risk Assessment" sx={{ p: { xs: 2, sm: 2.25 } }}>
              {/* Personal-data status comes from the backend classification for this source. */}
              <Stack spacing={0.25}>
                <RiskSeverityBar riskChip={riskChip} />
                <RiskRow label="Current risk level">
                  <Chip size="small" color={riskChip.color} label={riskChip.label} sx={{ minWidth: 92, fontWeight: 700 }} />
                </RiskRow>
                <RiskRow label="Personal Data">
                  <Chip
                    size="small"
                    color={containsPersonalData ? 'success' : 'default'}
                    label={containsPersonalData ? 'Yes' : 'No'}
                    variant="outlined"
                    sx={{ minWidth: 64, fontWeight: 700, bgcolor: containsPersonalData ? 'success.lighter' : 'grey.100' }}
                  />
                </RiskRow>
                <RiskRow label="Art. 9 data">
                  <Chip
                    size="small"
                    color={getArt9Color(getArt9Display(source))}
                    label={getArt9Display(source)}
                    variant="outlined"
                    sx={{ minWidth: 92, fontWeight: 600, bgcolor: getArt9Color(getArt9Display(source)) === 'warning' ? 'warning.lighter' : 'transparent' }}
                  />
                </RiskRow>
              </Stack>
            </PreviewPanel>

            <PreviewPanel icon={OrderedListOutlined} title="Selected compliance findings" sx={{ maxHeight: 260, overflow: 'hidden' }}>
              {/* Limit the initial findings list so long checklists do not dominate the preview dialog. */}
              {complianceFindings.length > 0 ? (
                <Stack spacing={1.25}>
                  <ComplianceFindingsList findings={visibleFindings} />
                  {hiddenFindingsCount > 0 && (
                    <Button
                      size="small"
                      color="primary"
                      aria-label="View all findings"
                      endIcon={<RightOutlined />}
                      sx={{ alignSelf: 'flex-start', px: 0, minWidth: 'auto' }}
                      onClick={() => setFindingsPopupOpen(true)}
                    >
                      View all findings
                    </Button>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No compliance findings selected.
                </Typography>
              )}
            </PreviewPanel>
          </Stack>
        </Box>
      </DialogContent>
      {(onOpenProject || onEdit) && (
        <DialogActions sx={{ px: { xs: 3, sm: 3.5 }, py: 2, justifyContent: 'space-between' }}>
          {onOpenProject ? (
            <Button
              color="secondary"
              variant="outlined"
              aria-label="Open Project"
              startIcon={<ExportOutlined />}
              onClick={onOpenProject}
            >
              Open Project
            </Button>
          ) : <Box />}
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="secondary" onClick={handleClose}>
              Close
            </Button>
            {onEdit && (
              <Button variant="contained" aria-label="Edit Data Source" startIcon={<EditOutlined />} onClick={onEdit}>
                Edit Data Source
              </Button>
            )}
          </Stack>
        </DialogActions>
      )}
      {/* The full findings dialog reuses the same list component to keep bullet and text alignment identical. */}
      <Dialog
        open={findingsPopupOpen}
        onClose={() => setFindingsPopupOpen(false)}
        aria-labelledby="all-findings-title"
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              maxWidth: 560,
              width: 'calc(100% - 48px)',
            },
          },
        }}
      >
        <DialogTitle id="all-findings-title" sx={{ px: 3, py: 2.25, pr: 7 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                flexShrink: 0,
                '& svg': { fontSize: 17 },
              }}
            >
              {/* Hide the decorative icon so the dialog's accessible name stays equal to its title. */}
              <OrderedListOutlined aria-hidden="true" />
            </Box>
            <Typography component="span" variant="h5" sx={{ fontWeight: 700 }}>
              All selected compliance findings
            </Typography>
          </Stack>
        </DialogTitle>
        <IconButton
          aria-label="Close findings popup"
          onClick={() => setFindingsPopupOpen(false)}
          sx={{ position: 'absolute', right: 16, top: 16 }}
        >
          <CloseOutlined />
        </IconButton>
        <DialogContent dividers sx={{ px: 3, py: 2.25, maxHeight: 420 }}>
          <ComplianceFindingsList findings={complianceFindings} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setFindingsPopupOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
