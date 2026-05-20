import { RouterProvider } from 'react-router-dom'

import ScrollTop from './components/ScrollTop.jsx'
import router from './routes'
import ThemeCustomization from './themes'

function App() {
  return (
    <ThemeCustomization>
      <ScrollTop>
        <RouterProvider router={router} />
      </ScrollTop>
    </ThemeCustomization>
  )
}

export default App
