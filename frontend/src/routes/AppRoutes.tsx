import { Route, Routes } from 'react-router-dom'
import LandingPage from '../pages/landing/LandingPage'
import DefinitionPage from '../pages/definition/DefinitionPage'
import VerdictPage from '../pages/verdict/VerdictPage'
import LoginPage from '../pages/login/LoginPage'
import RegisterPage from '../pages/register/RegisterPage'
import { ROUTE_PATHS } from './paths'

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.landing} element={<LandingPage />} />
      <Route path={ROUTE_PATHS.definition} element={<DefinitionPage />} />
      <Route path={ROUTE_PATHS.verdict} element={<VerdictPage />} />
      <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
      <Route path={ROUTE_PATHS.register} element={<RegisterPage />} />
    </Routes>
  )
}

export default AppRoutes
