import { useState } from 'react'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import {
  CarOutlined,
  DatabaseOutlined,
  EyeOutlined,
  HeartOutlined,
  MailOutlined,
  MessageOutlined,
  MoreOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'

const projects = [
  {
    id: 1,
    name: 'Customer Support NLP',
    description: 'NLP pipeline for analyzing customer support tickets.',
    sources: 3,
    risk: 'medium',
    updated: 'May 14, 2024',
    icon: MessageOutlined,
    color: 'primary',
  },
  {
    id: 2,
    name: 'E-commerce Recommender',
    description: 'Product recommendation model for our e-commerce platform.',
    sources: 4,
    risk: 'low',
    updated: 'May 10, 2024',
    icon: ShoppingCartOutlined,
    color: 'success',
  },
  {
    id: 3,
    name: 'Traffic Monitoring Vision',
    description: 'Computer vision pipeline for traffic analysis.',
    sources: 2,
    risk: 'high',
    updated: 'May 8, 2024',
    icon: CarOutlined,
    color: 'error',
  },
  {
    id: 4,
    name: 'Health Insights',
    description: 'Predictive model for patient health outcomes.',
    sources: 5,
    risk: 'medium',
    updated: 'May 5, 2024',
    icon: HeartOutlined,
    color: 'secondary',
  },
]

const dataSources = [
  { name: 'support_emails.csv', type: 'Email', format: 'CSV', personal: 'Yes', risk: 'Medium' },
  { name: 'customer_notes.json', type: 'Document', format: 'JSON', personal: 'Yes', risk: 'Medium' },
  { name: 'traffic_images.zip', type: 'Images', format: 'ZIP', personal: 'Yes', risk: 'High' },
]

const riskSummary = [
  { label: 'Email addresses detected', value: '1,248', icon: MailOutlined, color: 'primary' },
  { label: 'License plates detected', value: '342', icon: CarOutlined, color: 'secondary' },
  { label: 'Potential PII fields', value: '12', icon: TeamOutlined, color: 'success' },
]

function riskChipProps(risk) {
  if (risk === 'low') return { color: 'success', label: 'Low Risk' }
  if (risk === 'high') return { color: 'error', label: 'High Risk' }
  return { color: 'warning', label: 'Medium Risk' }
}

function ProjectIcon({ project }) {
  const Icon = project.icon

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 40,
        height: 40,
        bgcolor: `${project.color}.main`,
        color: 'common.white',
      }}
    >
      <Icon />
    </Avatar>
  )
}

export default function Dashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id)
  const selectedProject = projects.find((project) => project.id === selectedProjectId) || projects[0]

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Overview of your ML projects and their privacy risk status.
          </Typography>
        </Box>

      </Stack>

      <MainCard content={false}>
        <TableContainer>
          <Table sx={{ minWidth: 860 }} aria-label="Project privacy overview">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Data Sources</TableCell>
                <TableCell>Overall Risk</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const risk = riskChipProps(project.risk)
                const selected = project.id === selectedProjectId

                return (
                  <TableRow
                    hover
                    key={project.id}
                    selected={selected}
                    onClick={() => setSelectedProjectId(project.id)}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        outline: '1px solid',
                        outlineColor: 'primary.light',
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <ProjectIcon project={project} />
                        <Box>
                          <Typography variant="subtitle1">{project.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <DatabaseOutlined />
                        <Typography>{project.sources}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={risk.color} label={risk.label} />
                    </TableCell>
                    <TableCell>{project.updated}</TableCell>
                    <TableCell align="right">
                      <RightOutlined />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 420px' }, gap: 2.5 }}>
        <MainCard>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ProjectIcon project={selectedProject} />
              <Typography variant="h4">{selectedProject.name}</Typography>
              <Chip size="small" color="success" label="Active" />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {[
                ['Overall Risk', riskChipProps(selectedProject.risk).label],
                ['Contains Personal Data', 'Yes'],
                ['Art. 9 GDPR Data', 'Possible'],
                ['Last Updated', `${selectedProject.updated}\n10:42 AM`],
              ].map(([label, value], index) => (
                <Box
                  key={label}
                  sx={{
                    p: 1.5,
                    borderLeft: { sm: index === 0 ? 0 : '1px solid' },
                    borderTop: { xs: index === 0 ? 0 : '1px solid', sm: 0 },
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color={label === 'Contains Personal Data' ? 'error.main' : label === 'Art. 9 GDPR Data' ? 'warning.dark' : 'text.primary'}
                    sx={{ whiteSpace: 'pre-line' }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h5">Data Sources</Typography>
            <TableContainer>
              <Table size="small" aria-label="Selected project data sources">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Personal Data</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataSources.map((source) => (
                    <TableRow key={source.name}>
                      <TableCell>{source.name}</TableCell>
                      <TableCell>{source.type}</TableCell>
                      <TableCell>{source.format}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{source.personal}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={source.risk === 'High' ? 'error' : 'warning'}
                          label={source.risk}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label={`View ${source.name}`}>
                          <EyeOutlined />
                        </IconButton>
                        <IconButton size="small" aria-label={`More actions for ${source.name}`}>
                          <MoreOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button color="primary" endIcon={<RightOutlined aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }}>
              View all data sources
            </Button>
          </Stack>
        </MainCard>

        <MainCard>
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ThunderboltOutlined />
              <Typography variant="h5">Risk Summary</Typography>
            </Stack>

            {riskSummary.map((item) => {
              const Icon = item.icon
              return (
                <Stack key={item.label} direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: `${item.color}.lighter`, color: `${item.color}.main` }}>
                      <Icon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h3" color={`${item.color}.main`}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      width: 82,
                      height: 28,
                      borderBottom: '3px solid',
                      borderColor: `${item.color}.main`,
                      borderRadius: '50%',
                      transform: 'skew(-18deg)',
                      opacity: 0.8,
                    }}
                  />
                </Stack>
              )
            })}

            <Divider />

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.dark' }}>
                <ThunderboltOutlined />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">Recommendation</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Consider pseudonymizing email addresses and applying data minimization to customer notes.
                </Typography>
                <Button size="small" endIcon={<RightOutlined aria-hidden="true" />}>
                  View details
                </Button>
              </Box>
            </Stack>
          </Stack>
        </MainCard>
      </Box>
    </Stack>
  )
}
