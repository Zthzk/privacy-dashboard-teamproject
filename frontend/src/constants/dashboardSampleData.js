export const sampleProjects = [
  {
    id: 'sample-1',
    name: 'Customer Support NLP',
    description: 'NLP pipeline for analyzing customer support tickets.',
    data_sources_count: 3,
    risk_level: 'medium',
    icon_key: 'message',
    color: 'primary',
    updated_at: '2024-05-14T10:42:00Z',
    isSample: true,
  },
  {
    id: 'sample-2',
    name: 'E-commerce Recommender',
    description: 'Product recommendation model for our e-commerce platform.',
    data_sources_count: 4,
    risk_level: 'low',
    icon_key: 'shopping',
    color: 'success',
    updated_at: '2024-05-10T08:25:00Z',
    isSample: true,
  },
  {
    id: 'sample-3',
    name: 'Traffic Monitoring Vision',
    description: 'Computer vision pipeline for traffic analysis.',
    data_sources_count: 2,
    risk_level: 'high',
    icon_key: 'traffic',
    color: 'warning',
    updated_at: '2024-05-08T16:12:00Z',
    isSample: true,
  },
  {
    id: 'sample-4',
    name: 'Health Insights',
    description: 'Predictive model for patient health outcomes.',
    data_sources_count: 5,
    risk_level: 'medium',
    icon_key: 'health',
    color: 'error',
    updated_at: '2024-05-05T14:35:00Z',
    isSample: true,
  },
]

export const sampleDataSources = [
  {
    id: 'sample-1',
    name: 'support_emails.csv',
    project: 'sample-1',
    project_name: 'Customer Support NLP',
    source_type: 'file',
    source_type_display: 'Email',
    data_format_display: 'CSV',
    location: '/datasets/support_emails.csv',
    updated_at: '2024-05-14T09:05:00Z',
    personal_data: 'Yes',
    risk: 'Medium',
    metadata: { data_category_keys: ['contact_data', 'direct_identifiers'] },
    isSample: true,
  },
  {
    id: 'sample-2',
    name: 'customer_notes.json',
    project: 'sample-1',
    project_name: 'Customer Support NLP',
    source_type: 'file',
    source_type_display: 'Document',
    data_format_display: 'JSON',
    location: '/datasets/customer_notes.json',
    updated_at: '2024-05-14T09:12:00Z',
    personal_data: 'Yes',
    risk: 'Medium',
    metadata: { data_category_keys: ['contact_data', 'direct_identifiers'] },
    isSample: true,
  },
  {
    id: 'sample-3',
    name: 'traffic_images.zip',
    project: 'sample-3',
    project_name: 'Traffic Monitoring Vision',
    source_type: 'file',
    source_type_display: 'Images',
    data_format_display: 'ZIP',
    location: '/datasets/traffic_images.zip',
    updated_at: '2024-05-08T15:50:00Z',
    personal_data: 'Yes',
    risk: 'High',
    metadata: { data_category_keys: ['location_data', 'online_identifiers'] },
    isSample: true,
  },
]

export function mergeUniqueById(primaryList, fallbackList) {
  const mergedMap = new Map()

  primaryList.forEach((item) => {
    if (item?.id != null) {
      mergedMap.set(String(item.id), item)
    }
  })

  fallbackList.forEach((fallbackItem) => {
    if (fallbackItem?.id != null) {
      const key = String(fallbackItem.id)
      if (!mergedMap.has(key)) {
        mergedMap.set(key, fallbackItem)
      }
    }
  })

  return [...mergedMap.values()]
}
