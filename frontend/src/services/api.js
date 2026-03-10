import axios from 'axios'

const runtimeDefaultBase =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1`
    : 'http://localhost:5000/api/v1'

export const API_BASE = import.meta.env.VITE_API_BASE || runtimeDefaultBase

const api = axios.create({ baseURL: API_BASE })

// Attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Add response error handler
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google')

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login'
      }
    }

    console.error('API Error:', {
      message: error.message,
      status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url
    })
    return Promise.reject(error)
  }
)

export default api
