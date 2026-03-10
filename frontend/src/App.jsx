import React, { Suspense, lazy, startTransition, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Plants = lazy(() => import('./pages/Plants'))
const Scans = lazy(() => import('./pages/Scans'))
const Disease = lazy(() => import('./pages/Disease'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Admin = lazy(() => import('./pages/Admin'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const Profile = lazy(() => import('./pages/Profile'))
const Community = lazy(() => import('./pages/Community'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Support = lazy(() => import('./pages/Support'))
const Contributors = lazy(() => import('./pages/Contributors'))
const AloeMap = lazy(() => import('./pages/AloeMap'))

// Helper function to get auth state
function getAuthState() {
  const token = localStorage.getItem('token')
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const role = (storedUser?.role || storedUser?.user?.role || '').toString().toLowerCase()
  return {
    isAuth: !!token,
    isAdmin: role === 'admin'
  }
}

// Protected Admin Route Component
function ProtectedAdminRoute() {
  const { isAuth, isAdmin } = getAuthState()
  
  if (!isAuth) {
    return <Navigate to="/login" />
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }
  
  return <Admin />
}

export default function App() {
  const { isAuth } = getAuthState()
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)
  const isAdminRoute = location.pathname === '/admin'
  const isCommunityRoute = location.pathname === '/community'
  const isAnalyticsRoute = location.pathname === '/analytics'
  const isPlantsRoute = location.pathname === '/plants'
  const isAboutRoute = location.pathname === '/about-us' || location.pathname === '/aboutus'
  const isContributorsRoute = location.pathname === '/contributors'
  const isMapRoute = location.pathname === '/aloe-map'
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const isLandingRoute = location.pathname === '/'
  const isFullBleedRoute = isAdminRoute || isLandingRoute || isAuthRoute || isCommunityRoute || isAnalyticsRoute || isPlantsRoute || isAboutRoute || isContributorsRoute || isMapRoute
  const isChatbotPage = location.pathname === '/chatbot'
  const shouldShowFloatingChatbot = isAuth && !isAdminRoute && !isChatbotPage
  const toggleFloatingChatbot = () => {
    startTransition(() => {
      setChatOpen((prev) => !prev)
    })
  }

  return (
    <div className={isAdminRoute ? 'admin-route-shell' : ''}>
      {!isAdminRoute && !isLandingRoute && !isAuthRoute && <NavBar />}
      <main className={isFullBleedRoute ? '' : 'container'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={isAuth ? <Dashboard /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/plants" element={isAuth ? <Plants /> : <Navigate to="/login" />} />
            <Route path="/scans" element={isAuth ? <Scans /> : <Navigate to="/login" />} />
            <Route path="/diseases/:id" element={<Disease />} />
            <Route path="/analytics" element={isAuth ? <Analytics /> : <Navigate to="/login" />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="/contributors" element={<Contributors />} />
            <Route path="/community" element={isAuth ? <Community /> : <Navigate to="/login" />} />
            <Route path="/chatbot" element={isAuth ? <Chatbot /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuth ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/support" element={isAuth ? <Support /> : <Navigate to="/login" />} />
            <Route path="/aloe-map" element={isAuth ? <AloeMap /> : <Navigate to="/login" />} />
            <Route path="/admin" element={<ProtectedAdminRoute />} />
          </Routes>
        </Suspense>
      </main>

      {shouldShowFloatingChatbot && (
        <>
          {chatOpen && (
            <div style={floatingStyles.panel}>
              <div style={floatingStyles.panelHeader}>
                <span style={floatingStyles.panelTitle}>Aloe Assistant</span>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  style={floatingStyles.closeBtn}
                  aria-label="Close chatbot"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8f5ec" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={floatingStyles.panelBody}>
                <Chatbot embedded />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFloatingChatbot}
            style={floatingStyles.fab}
            aria-label="Open chatbot"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

function PageLoader() {
  return (
    <div style={floatingStyles.pageLoader}>
      Loading...
    </div>
  )
}

const floatingStyles = {
  pageLoader: {
    minHeight: '40vh',
    display: 'grid',
    placeItems: 'center',
    color: '#2a6549',
    fontWeight: 700,
    fontSize: '15px'
  },
  fab: {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    width: '56px',
    height: '56px',
    borderRadius: '999px',
    border: '1px solid rgba(173, 206, 186, 0.6)',
    background: 'linear-gradient(135deg, #1f7a46 0%, #185f38 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1200,
    boxShadow: '0 10px 24px rgba(6, 22, 14, 0.35)',
  },
  panel: {
    position: 'fixed',
    right: '18px',
    bottom: '84px',
    width: 'min(390px, calc(100vw - 24px))',
    height: 'min(640px, 76vh)',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(173, 206, 186, 0.45)',
    background: 'rgba(10, 38, 25, 0.78)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 16px 30px rgba(5, 20, 13, 0.35)',
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(173, 206, 186, 0.35)',
    background: 'rgba(24, 71, 45, 0.85)',
  },
  panelTitle: {
    color: '#e9f6ee',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid rgba(173, 206, 186, 0.4)',
    background: 'rgba(188, 229, 202, 0.14)',
    color: '#e8f5ec',
    cursor: 'pointer',
    padding: 0,
    display: 'grid',
    placeItems: 'center',
  },
  panelBody: {
    flex: 1,
    minHeight: 0,
  },
}
