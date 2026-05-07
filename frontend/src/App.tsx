import { BrowserRouter } from 'react-router-dom'
import { AiSessionProvider } from './ai'
import { AuthProvider } from './auth'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AiSessionProvider>
          <AppRoutes />
        </AiSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
