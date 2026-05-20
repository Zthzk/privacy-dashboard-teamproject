import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import 'simplebar-react/dist/simplebar.min.css'

import './index.css'
import App from './App.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
