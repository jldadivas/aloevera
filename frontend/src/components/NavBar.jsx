import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Home, Leaf, BarChart3, Scan, Users, UserCircle, Share2, LifeBuoy, MapPinned } from 'lucide-react'
import api from '../services/api'
import { signOut } from 'firebase/auth'
import { firebaseAuth } from '../services/firebase'

const GOOGLE_AUTH_PENDING_KEY = 'vera:google_auth_pending'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const lastUnreadRef = useRef(0)
  const initializedRef = useRef(false)

  const isAuth = !!localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRecord = user?.user || user
  const displayName = userRecord.full_name || userRecord.name || 'User'
  const profileImage = userRecord.profile_picture?.url || ''
  const resolvedRole = (
    user?.role ||
    user?.user?.role ||
    ''
  ).toString().toLowerCase()
  const isAdmin = resolvedRole === 'admin'

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {})
      await signOut(firebaseAuth).catch(() => {})
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      setUserDropdownOpen(false)
      navigate('/login')
    }
  }

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    if (!isAuth) return

    let mounted = true
    let timerId = null

    const fetchUnread = async () => {
      try {
        const res = await api.get('/community/chat/conversations')
        const rows = Array.isArray(res.data?.data) ? res.data.data : []
        const totalUnread = rows.reduce((sum, row) => sum + Number(row?.unread_count || 0), 0)

        if (!mounted) return
        setUnreadChatCount(totalUnread)

        if (!initializedRef.current) {
          initializedRef.current = true
          lastUnreadRef.current = totalUnread
          return
        }

        if (totalUnread > lastUnreadRef.current) {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('New message', {
                body: `You have ${totalUnread} unread chat message${totalUnread > 1 ? 's' : ''}.`
              })
            }
          }
        }

        lastUnreadRef.current = totalUnread
      } catch (_) {
        // Silent fail for notification polling
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }

    fetchUnread()
    timerId = setInterval(fetchUnread, 15000)

    return () => {
      mounted = false
      if (timerId) clearInterval(timerId)
    }
  }, [isAuth])

  return (
    <nav className="sticky top-0 z-50 border-b border-[#a7d8a0] bg-[#c7eebd]/95 text-[#234a31] shadow-sm backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">
          
          {/* Logo */}
          <Link
            to={isAuth ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 text-[#1f4d2a] hover:text-[#15381e] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#9ccc9e] bg-white shadow-sm">
              <img
                src="/images/system-logo.png"
                alt="Vera Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-bold tracking-tight text-[#1f4d2a]">Aloe Vera</div>
              <div className="text-[11px] text-[#3d6a49] font-semibold">Monitoring System</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {isAuth ? (
              <>
                <NavLink 
                  to="/dashboard" 
                  label="Dashboard"
                  icon={<Home className="w-4 h-4" />}
                  isActive={isActive}
                />
                <NavLink 
                  to="/plants" 
                  label="Aloe Plants"
                  icon={<Leaf className="w-4 h-4" />}
                  isActive={isActive}
                />
                <NavLink 
                  to="/scans" 
                  label="Scans"
                  icon={<Scan className="w-4 h-4" />}
                  isActive={isActive}
                />
                <NavLink 
                  to="/analytics" 
                  label="Analytics"
                  icon={<BarChart3 className="w-4 h-4" />}
                  isActive={isActive}
                />
                <NavLink 
                  to="/community" 
                  label="Community"
                  icon={<Share2 className="w-4 h-4" />}
                  badge={unreadChatCount}
                  isActive={isActive}
                />
                
                <NavLink
                  to="/support"
                  label="Support"
                  icon={<LifeBuoy className="w-4 h-4" />}
                  isActive={isActive}
                />
                <NavLink
                  to="/aloe-map"
                  label="Aloe Map"
                  icon={<MapPinned className="w-4 h-4" />}
                  isActive={isActive}
                />

                {isAdmin && (
                  <NavLink 
                    to="/admin" 
                    label="Admin"
                    icon={<Users className="w-4 h-4" />}
                    isActive={isActive}
                  />
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border border-[#9fcd9a] bg-[#d9f3d0] hover:bg-[#cdeec3] transition-colors"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-emerald-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-[#234a31] max-w-[120px] truncate">{displayName}</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#f5fbf4] text-[#234a31] rounded-xl border border-[#b9ddb5] shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#d5ead2] bg-[#edf7eb]">
                        <p className="text-sm font-semibold text-[#234a31]">{displayName}</p>
                        <p className="text-xs text-[#4c7658] truncate">{userRecord.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-emerald-50 text-emerald-700 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink 
                  to="/login" 
                  label="Sign In"
                  isActive={isActive}
                />
                <Link
                  to="/register"
                  className="px-4 py-2.5 bg-[#2f8a45] text-white rounded-xl font-semibold hover:bg-[#216335] transition-colors shadow-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

/* NavLink component */
function NavLink({ to, label, icon, isActive, badge = 0 }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
        isActive(to)
          ? 'bg-[#aee2a9] text-[#1f4d2a]'
          : 'text-[#2f5c3a] hover:text-[#15381e] hover:bg-[#d9f3d0]'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
