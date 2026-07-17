import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { InfoCircleOutlined } from '@ant-design/icons'

// Derives the source URL directly from the article number, since every GDPR/EU AI Act
// link in the backend (format_hints.py) follows one of exactly two fixed patterns.
// This avoids relying on a format's relevant_articles list actually listing the article
// referenced by a checklist item (it often doesn't — e.g. CSV's checklist cites
// "Art. 6 GDPR" even though CSV's own relevant_articles never mentions Art. 6).
// Combined references like "Art. 9/6 GDPR" resolve to the first (more severe) article.
function resolveArticleUrl(article) {
  if (!article) return undefined

  const articleNumber = article.match(/Art\.\s*(\d+)/)?.[1]
  if (!articleNumber) return undefined

  if (article.includes('EU AI Act')) {
    return `https://artificialintelligenceact.eu/article/${articleNumber}/`
  }
  if (article.includes('GDPR')) {
    return `https://gdpr-info.eu/art-${articleNumber}-gdpr/`
  }
  return undefined
}

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
            {hint.checklist?.length > 0 && (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={500}>Check your data for:</Typography>
                {hint.checklist.map((item) => {
                  const label = item?.label ?? item
                  const article = item?.article
                  const text = article ? `${article} — ${label}` : label
                  const url = resolveArticleUrl(article)

                  if (!url) {
                    return <Typography key={label} variant="body2">• {text}</Typography>
                  }

                  return (
                    <Link
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      underline="none"
                      sx={{ color: 'rgb(113, 128, 150)', '&:hover': { color: 'primary.main' } }}
                    >
                      • {text}
                    </Link>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Alert>
  )
}
