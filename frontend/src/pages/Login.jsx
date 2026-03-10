import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Leaf, LogIn, UserPlus } from 'lucide-react'
import api, { API_BASE } from '../services/api'
import { getRedirectResult, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { firebaseAuth, googleProvider } from '../services/firebase'

const GOOGLE_AUTH_PENDING_KEY = 'vera:google_auth_pending'

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef(null)

  const derivedInitialMode = useMemo(() => {
    if (initialMode === 'register') return 'register'
    if (location.pathname === '/register') return 'register'
    return 'login'
  }, [initialMode, location.pathname])

  const [mode, setMode] = useState(derivedInitialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoFallbackIndex, setVideoFallbackIndex] = useState(0)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    profilePicture: null
  })

  const isRegister = mode === 'register'
  const videoCandidates = isRegister
    ? ['/videos/aloe-background-3.mp4', '/videos/aloe-background-1.mp4']
    : ['/videos/aloe-background-2.mp4', '/videos/aloe-background-1.mp4']
  const videoSrc = videoCandidates[Math.min(videoFallbackIndex, videoCandidates.length - 1)]

  const switchMode = () => {
    setError('')
    setVideoFallbackIndex(0)
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
  }

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.load()
    el.play().catch(() => {})
  }, [mode, videoSrc])

  const handleAuthSuccess = (token, user) => {
    localStorage.clear()
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  // Finalize Google OAuth session
  const finalizeGoogleSession = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken(true)
    const res = await api.post(`${API_BASE}/auth/google`, { idToken })
    const token = res.data?.data?.token
    const user = res.data?.data?.user
    const role = (user?.role || '').toString().toLowerCase()
    if (!token) throw new Error('No token returned from server')

    handleAuthSuccess(token, user)
    navigate(role === 'admin' ? '/admin' : '/dashboard')
  }

  // Handle Google redirect after popup blocked
  useEffect(() => {
    const completeGoogleRedirect = async () => {
      const isGoogleAuthPending = localStorage.getItem(GOOGLE_AUTH_PENDING_KEY) === '1'
      if (!isGoogleAuthPending) return
      try {
        const result = await getRedirectResult(firebaseAuth)
        if (!result?.user) return
        setLoading(true)
        setError('')
        await finalizeGoogleSession(result.user)
      } catch (err) {
        if (err?.code !== 'auth/no-auth-event') {
          setError(err.response?.data?.error || err.message || 'Google sign-in failed')
        }
      } finally {
        localStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
        setLoading(false)
      }
    }
    completeGoogleRedirect()
  }, [navigate])

  // ----------------- LOGIN -----------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      localStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      if (firebaseAuth.currentUser) await signOut(firebaseAuth).catch(() => {})

      const res = await api.post(`${API_BASE}/auth/login`, loginForm)
      const token = res.data?.data?.token
      const user = res.data?.data?.user
      const role = (user?.role || '').toString().toLowerCase()
      if (!token) throw new Error('No token returned from server')

      handleAuthSuccess(token, user)
      navigate(role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      if (!err.response) setError(`Network Error: Cannot reach server at ${API_BASE}`)
      else if (err.response?.status === 401) setError('Invalid email or password')
      else setError(err.response?.data?.error || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // ----------------- GOOGLE SIGN-IN -----------------
  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(firebaseAuth, googleProvider)
      await finalizeGoogleSession(result.user)
    } catch (err) {
      const code = err?.code || ''
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        try {
          localStorage.setItem(GOOGLE_AUTH_PENDING_KEY, '1')
          await signInWithRedirect(firebaseAuth, googleProvider)
          return
        } catch (redirectErr) {
          localStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
          setError(redirectErr.response?.data?.error || redirectErr.message || 'Google sign-in failed')
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Google sign-in failed')
      }
      setLoading(false)
    } finally {
      if (localStorage.getItem(GOOGLE_AUTH_PENDING_KEY) !== '1') setLoading(false)
    }
  }

  // ----------------- REGISTER -----------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      localStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      if (firebaseAuth.currentUser) await signOut(firebaseAuth).catch(() => {})

      if (!registerForm.profilePicture) throw new Error('Profile picture is required')

      const form = new FormData()
      form.append('full_name', registerForm.fullName)
      form.append('email', registerForm.email)
      form.append('password', registerForm.password)
      form.append('profile_picture', registerForm.profilePicture)

      const res = await api.post(`${API_BASE}/auth/register`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const token = res.data?.data?.token
      const user = res.data?.data?.user
      if (!token) throw new Error('No token returned from server')

      handleAuthSuccess(token, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // ----------------- JSX -----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08170f] via-[#0f2a1c] to-[#08170f] p-0">
      <div className="relative h-screen w-full overflow-hidden border-0 rounded-none shadow-none">
        <div className={`auth-split h-full ${isRegister ? 'is-register' : ''}`}>
          <div className="auth-pane auth-pane-form z-20 min-h-[420px] sm:min-h-0">
            <div className="h-full">
              <AuthCard
                mode={mode}
                loading={loading}
                error={error}
                onSwitch={switchMode}
                onGoogleSignIn={handleGoogleSignIn}
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                registerForm={registerForm}
                setRegisterForm={setRegisterForm}
                onLoginSubmit={handleLoginSubmit}
                onRegisterSubmit={handleRegisterSubmit}
              />
            </div>
          </div>

          <div className="auth-pane auth-pane-media relative min-h-[280px] sm:min-h-0">
            <div className="relative h-full">
              <video
                ref={videoRef}
                key={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/images/aloe2.jpg"
                className="absolute inset-0 h-full w-full object-cover"
                src={videoSrc}
                onError={() =>
                  setVideoFallbackIndex((prev) => (prev + 1 < videoCandidates.length ? prev + 1 : prev))
                }
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/20 to-black/45" />
              <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/35 bg-black/20 px-3 py-1 text-xs font-bold tracking-widest text-emerald-100">
                  <Leaf size={14} />
                  VERA ALOE SYSTEM
                </div>
                <div className="max-w-md">
                  <h2 className="mb-3 text-3xl font-extrabold leading-tight text-emerald-50 md:text-4xl">
                    {isRegister ? 'Create Your Aloe Profile' : 'Welcome Back Grower'}
                  </h2>
                  <p className="text-base font-medium text-emerald-100/90">
                    {isRegister
                      ? 'Set up your account and begin tracking aloe performance with AI recommendations.'
                      : 'Sign in to continue monitoring crops, detections, and daily plant health progress.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={switchMode}
          className="absolute left-1/2 top-1/2 z-40 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-100/50 bg-emerald-900/90 text-emerald-50 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-500 hover:bg-emerald-800 sm:inline-flex"
          aria-label={isRegister ? 'Switch to login' : 'Switch to register'}
        >
          <ArrowLeftRight size={18} />
        </button>
      </div>
    </div>
  )
}

function AuthCard({
  mode,
  loading,
  error,
  onSwitch,
  onGoogleSignIn,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  onLoginSubmit,
  onRegisterSubmit
}) {
  const isRegister = mode === 'register'

  return (
    <section className="flex h-full items-center justify-center bg-gradient-to-b from-[#edf7ee] to-[#dcebdc] p-6 md:p-10">
      <div className="w-full max-w-md rounded-3xl border border-emerald-900/10 bg-white p-7 shadow-[0_16px_32px_rgba(27,66,42,0.15)] md:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Aloe Secure Auth</p>
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-950">{isRegister ? 'Create Account' : 'Sign In'}</h1>
        <p className="mt-2 text-sm font-medium text-emerald-800/80">
          {isRegister
            ? 'Create your workspace for AI-powered aloe insights.'
            : 'Continue managing your aloe health dashboard.'}
        </p>

        {!isRegister ? (
          <form onSubmit={onLoginSubmit} className="mt-6 space-y-4">
            <FieldLabel text="Email Address" />
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              type="email"
              placeholder="you@example.com"
              required
              className="auth-input"
            />
            <FieldLabel text="Password" />
            <input
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              type="password"
              placeholder="Enter password"
              required
              className="auth-input"
            />

            {error && <ErrorBox text={error} />}

            <button
              type="submit"
              disabled={loading}
              className="!mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 py-3 text-sm font-bold text-emerald-50 shadow-none transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-65"
            >
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onGoogleSignIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-900 shadow-none transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {loading ? 'Please wait...' : 'Sign In with Google'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className="mt-6 space-y-4">
            <FieldLabel text="Full Name" />
            <input
              value={registerForm.fullName}
              onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
              placeholder="John Doe"
              required
              className="auth-input"
            />
            <FieldLabel text="Email Address" />
            <input
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              type="email"
              placeholder="you@example.com"
              required
              className="auth-input"
            />
            <FieldLabel text="Password" />
            <input
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              type="password"
              placeholder="Enter password"
              required
              className="auth-input"
            />
            <FieldLabel text="Profile Picture" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setRegisterForm({ ...registerForm, profilePicture: e.target.files?.[0] || null })}
              required
              className="auth-input auth-file-input"
            />

            {error && <ErrorBox text={error} />}

            <button
              type="submit"
              disabled={loading}
              className="!mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 py-3 text-sm font-bold text-emerald-50 shadow-none transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-65"
            >
              <UserPlus size={16} />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm font-semibold text-emerald-800/85">
          {isRegister ? 'Already have an account?' : 'Need a new account?'}{' '}
          <button
            type="button"
            onClick={onSwitch}
            disabled={loading}
            className="bg-transparent p-0 font-extrabold text-emerald-900 underline decoration-emerald-500/70 underline-offset-4 shadow-none hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </section>
  )
}

function FieldLabel({ text }) {
  return <label className="!mb-1 block text-xs font-bold uppercase tracking-wider text-emerald-900/85">{text}</label>
}

function ErrorBox({ text }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {text}
    </div>
  )
}