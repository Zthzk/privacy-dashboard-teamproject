import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { InfoCircleOutlined } from '@ant-design/icons'

export default function DataFormatHintAlert({ hint }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (!hint) return null

  return (
    <Alert severity={hint.art9_risk ? 'warning' : 'info'} icon={<InfoCircleOutlined />}>
      <Stack spacing={0.5}>
        <Typography variant="body2">{hint.hint}</Typography>

        <Button
          size="small"
          variant="text"
          sx={{ alignSelf: 'flex-start', p: 0, minWidth: 0, textTransform: 'none' }}
          onClick={() => setDetailsOpen((prev) => !prev)}
        >
          {detailsOpen ? 'Show less' : 'Show details'}
        </Button>

        <Collapse in={detailsOpen}>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            {/* Optional chaining guards against API responses predating these fields. */}
            {hint.relevant_articles?.length > 0 && (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={500}>Relevant GDPR / EU AI Act articles:</Typography>
                {hint.relevant_articles.map((article) => (
                  <Link
                    key={article.title}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    underline="none"
                    sx={{ color: 'rgb(113, 128, 150)', '&:hover': { color: 'primary.main' } }}
                  >
                    • {article.title}
                  </Link>
                ))}
              </Stack>
            )}

            {hint.checklist?.length > 0 && (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={500}>Check your data for:</Typography>
                {hint.checklist.map((item) => (
                  <Typography key={item} variant="body2">• {item}</Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Alert>
  )
}
