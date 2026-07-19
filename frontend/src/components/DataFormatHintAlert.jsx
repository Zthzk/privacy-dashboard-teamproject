import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { InfoCircleOutlined } from '@ant-design/icons'

import { resolveArticleUrl } from 'utils/articleUrls'

// Read-only informational alert shown under the data-format field on the add/edit
// data-source forms. It displays the privacy hint for the selected format and, when
// expanded, the list of checklist items as clickable links to the relevant GDPR /
// EU AI Act articles.
//
// This is purely informational ("what to look for") and is separate from the
// interactive compliance checklist in AddDataSource/EditDataSource, where the user
// actually ticks the violations that feed the risk score. Both are driven by the same
// `hint` object (one format entry from the /datasource-format-hints/ API), but this
// component never changes any state — it only renders.
//
// `hint` shape: { hint: string, art9_risk: boolean, checklist: [{ label, article, ... }] }.
export default function DataFormatHintAlert({ hint }) {
  // Whether the "Check your data for" article list is expanded.
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Nothing to show until the parent has loaded the hints for the current format.
  if (!hint) return null

  return (
    // Formats that commonly carry Art. 9 special-category data (image, audio, video)
    // use the yellow "warning" style; all others use the neutral "info" style.
    <Alert severity={hint.art9_risk ? 'warning' : 'info'} icon={<InfoCircleOutlined />}>
      <Stack spacing={0.5}>
        {/* Short one-line hint text for the selected format. */}
        <Typography variant="body2">{hint.hint}</Typography>

        {/* Toggles the detailed article list below without leaving the page. */}
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
            {/* Optional chaining guards against older API responses without a checklist. */}
            {hint.checklist?.length > 0 && (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={500}>Check your data for:</Typography>
                {hint.checklist.map((item) => {
                  // Checklist items arrive as enriched objects ({ label, article, ... }),
                  // but fall back to a plain string for backward compatibility.
                  const label = item?.label ?? item
                  const article = item?.article
                  // Render as "Art. 6 GDPR — <label>" when an article is known.
                  const text = article ? `${article} — ${label}` : label
                  const url = resolveArticleUrl(article)

                  // No resolvable article link → show the item as plain, non-clickable text.
                  if (!url) {
                    return <Typography key={label} variant="body2">• {text}</Typography>
                  }

                  // Otherwise link the whole line to the article on gdpr-info.eu /
                  // artificialintelligenceact.eu, opened in a new tab.
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
