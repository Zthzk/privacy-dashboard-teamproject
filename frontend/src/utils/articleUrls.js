// Derives the source URL directly from the article number, since every GDPR/EU AI Act
// link in the backend (format_hints.py / violation_weights.py) follows one of exactly
// two fixed patterns. This avoids depending on a format's relevant_articles list actually
// listing the article referenced by a checklist item (it often doesn't — e.g. CSV's
// checklist cites "Art. 6 GDPR" even though CSV's own relevant_articles never mentions it).
// Combined references like "Art. 9/6 GDPR" resolve to the first (more severe) article.
export function resolveArticleUrl(article) {
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
