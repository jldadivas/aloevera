import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { API_BASE } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(true)

  const loadSummary = async () => {
    setChecking(true)
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      console.log('Dashboard loading summary. Token present:', !!token)
      console.log('Stored user:', user ? JSON.parse(user).email : 'none')
      
      const res = await api.get('/analytics/summary')
      console.log('Analytics summary loaded:', res.data?.data)
      setSummary(res.data?.data)
      setError(null)
    } catch (err) {
      console.error('Analytics error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        error: err.response?.data,
        message: err.message
      })
      if (!err.response) {
        setError(`Cannot reach backend at ${API_BASE}. Is the backend running?`)
      } else {
        setError(err.response?.data?.error || err.message)
      }
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const parseCount = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  const normalizeKey = (value = '') => String(value).toLowerCase().trim().replace(/\s+/g, '_')
  const parseBoolean = (value) => {
    if (value === true || value === false) return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
    return false
  }
  const isHealthyMarker = (value = '') => {
    const normalized = normalizeKey(value)
    return !normalized || ['none', 'healthy', 'normal', 'no_disease', 'no_issue', 'clear'].includes(normalized)
  }
  const hasDiseaseInAnalysis = (analysis = {}) => {
    if (!analysis) return false
    if (parseBoolean(analysis.disease_detected)) return true
    if (!isHealthyMarker(analysis.disease_severity)) return true
    if (Array.isArray(analysis.detected_conditions)) {
      const flagged = analysis.detected_conditions.some((condition) => !isHealthyMarker(condition))
      if (flagged) return true
    }
    return !isHealthyMarker(analysis.disease_name)
  }

  const summaryData = summary?.summary || summary || {}
  const diseaseCount = parseCount(
    summaryData.diseased_plants ??
    summaryData.diseased_plants_count ??
    summaryData.total_diseases ??
    0
  )
  const totalScans = parseCount(summaryData.total_scan_events ?? summaryData.total_scans ?? 0)
  const totalPlants = parseCount(summaryData.total_plants ?? 0)
  const recentScans = summary?.recent_scans || []
  const statCardImages = {
    scans: '/images/aloe1.jpg',
    disease: '/images/aloe-disease-detection.jpg',
    plants: '/images/aloe2.jpg',
  }
  const activityFallbackImages = [
    '/images/aloe1.jpg',
    '/images/aloe2.jpg',
    '/images/aloe3.jpg',
    '/images/aloe-disease-detection.jpg',
  ]

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return 'just now'
    const date = new Date(dateValue)
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / (1000 * 60))
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const recentActivity = recentScans.slice(0, 5).map((scan, index) => {
    const analysis = scan.analysis_result || {}
    const isDiseased = hasDiseaseInAnalysis(analysis)
    const diseaseName = analysis.disease_name || 'disease'
    const healthScore = analysis.health_score ?? analysis.plant_health_score
    const plantLabel = scan.plant_id?.plant_id || 'Plant'

    return {
      id: scan._id,
      title: isDiseased
        ? `${plantLabel} disease detected`
        : `${plantLabel} scan completed`,
      meta: isDiseased
        ? `Detected: ${diseaseName}`
        : `Health score: ${healthScore ?? 0}/100`,
      time: formatTimeAgo(scan.createdAt),
      isDiseased,
      imageUrl:
        scan.image_data?.thumbnail_url ||
        scan.image_data?.original_url ||
        activityFallbackImages[index % activityFallbackImages.length],
    }
  })

  // Calculate health percentage
  const healthBase = totalPlants > 0 ? totalPlants : Math.max(totalScans, 1)
  const healthPercentage = summary 
    ? Math.max(0, Math.min(100, Math.round(((healthBase - diseaseCount) / healthBase) * 100)))
    : 0

  return (
    <div style={styles.container}>
      <div style={styles.backgroundLayer} />
      <div style={styles.contentLayer}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.errorAlert}>
          <svg style={styles.errorIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={styles.errorTitle}>Connection Error</div>
            <div style={styles.errorMessage}>{error}</div>
          </div>
          <div style={styles.errorActions}>
            <button style={styles.retryButton} onClick={loadSummary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Retry
            </button>
            <button
              style={styles.statusButton}
              onClick={() => window.open(API_BASE, '_blank')}
            >
              API Status
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {checking && (
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading dashboard data...</p>
        </div>
      )}

      {/* Empty State */}
      {!summary && !error && !checking && (
        <div style={styles.emptyState}>
          <svg style={styles.emptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
          <h3 style={styles.emptyTitle}>No data available</h3>
          <p style={styles.emptyText}>
            Start by adding aloe plants and performing scans to see your dashboard analytics
          </p>
        </div>
      )}

      {/* Main Content */}
      {summary && !checking && (
        <>
          {/* Hero Status Card */}
          <div style={styles.heroCard}>
            <div style={styles.heroContent}>
              <div style={styles.heroLeft}>
                <div style={styles.heroLabel}>Overall Aloe Vera Health</div>
                <div style={styles.heroStatus}>
                  {diseaseCount > 0 ? (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Attention Needed
                    </>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      All Systems Healthy
                    </>
                  )}
                </div>
                <p style={styles.heroDescription}>
                  {diseaseCount > 0
                    ? `${diseaseCount} disease${diseaseCount > 1 ? 's' : ''} detected across your plants. Review recent scans for details.`
                    : 'All scanned plants show normal growth indicators with no detected issues.'}
                </p>
              </div>
              <div style={styles.heroRight}>
                <div style={styles.healthCircle}>
                  <svg style={styles.healthCircleSvg} viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="white"
                      strokeWidth="8"
                      strokeDasharray={`${healthPercentage * 2.512} 251.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div style={styles.healthPercentage}>
                    <div style={styles.healthValue}>{healthPercentage}%</div>
                    <div style={styles.healthLabel}>Healthy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <img
                src={statCardImages.scans}
                alt="Total scans"
                style={{ ...styles.statCardImage, ...styles.statCardImageScans }}
              />
              <div style={styles.statHeader}>
                <div style={styles.statIconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div style={styles.statTrend}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                </div>
              </div>
              <div style={styles.statValue}>{totalScans}</div>
              <div style={styles.statLabel}>Total Scans</div>
              <div style={styles.statFooter}>All time scans performed</div>
            </div>

            <div style={styles.statCard}>
              <img
                src={statCardImages.disease}
                alt="Diseases detected"
                style={{ ...styles.statCardImage, ...styles.statCardImageDisease }}
              />
              <div style={styles.statHeader}>
                <div style={{
                  ...styles.statIconWrapper,
                  backgroundColor: diseaseCount > 0 ? '#fee2e2' : '#dcfce7',
                  color: diseaseCount > 0 ? '#dc2626' : '#16a34a',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>
              <div style={styles.statValue}>{diseaseCount}</div>
              <div style={styles.statLabel}>Diseases Detected</div>
              <div style={styles.statFooter}>Active health issues</div>
            </div>

            <div style={styles.statCard}>
              <img
                src={statCardImages.plants}
                alt="Plants tracked"
                style={{ ...styles.statCardImage, ...styles.statCardImagePlants }}
              />
              <div style={styles.statHeader}>
                <div style={styles.statIconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
              </div>
              <div style={styles.statValue}>{summaryData.total_plants ?? 0}</div>
              <div style={styles.statLabel}>Aloe Vera Tracked</div>
              <div style={styles.statFooter}>Registered in system</div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div style={styles.activitySection}>
            <div style={styles.activityHeader}>
              <h2 style={styles.activityTitle}>Recent Activity</h2>
              <button style={styles.viewAllButton} onClick={() => navigate('/scans')}>
                View All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div style={styles.activityList}>
              {recentActivity.length === 0 && (
                <div style={styles.noActivityText}>No scan activity yet.</div>
              )}

              {recentActivity.map((item) => (
                <div key={item.id} style={styles.activityItem}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{
                      ...styles.activityImage,
                      ...(item.isDiseased ? styles.activityImageAlert : styles.activityImageHealthy),
                    }}
                  />
                  <div style={{
                    ...styles.activityIcon,
                    backgroundColor: item.isDiseased ? '#fee2e2' : '#dcfce7',
                    color: item.isDiseased ? '#dc2626' : '#16a34a',
                  }}>
                    {item.isDiseased ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>{item.title}</div>
                    <div style={styles.activityMeta}>{item.meta}</div>
                  </div>
                  <div style={styles.activityTime}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <h2 style={styles.quickActionsTitle}>Explore System Categories</h2>
            <div style={styles.quickActionsGrid}>
              <button style={styles.quickActionCard} onClick={() => navigate('/scans')}>
                <div style={{
                  ...styles.quickActionIcon,
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div style={styles.quickActionText}>New Scan</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.quickActionArrow}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button style={styles.quickActionCard} onClick={() => navigate('/plants')}>
                <div style={{
                  ...styles.quickActionIcon,
                  backgroundColor: '#dbeafe',
                  color: '#2563eb',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div style={styles.quickActionText}>Add Plant</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.quickActionArrow}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button style={styles.quickActionCard} onClick={() => navigate('/analytics')}>
                <div style={{
                  ...styles.quickActionIcon,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div style={styles.quickActionText}>View Reports</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.quickActionArrow}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: '20px 18px 34px',
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    backgroundColor: 'rgba(11, 42, 28, 0.48)',
    borderRadius: '16px',
    border: '1px solid rgba(172, 211, 188, 0.4)',
    boxShadow: '0 16px 30px rgba(6, 22, 14, 0.28)',
    backdropFilter: 'blur(8px)',
  },
  backgroundLayer: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at 14% 14%, rgba(255, 255, 255, 0.75) 0%, transparent 38%), radial-gradient(circle at 92% 0%, rgba(178, 207, 186, 0.32) 0%, transparent 34%)',
    opacity: 1,
    pointerEvents: 'none',
    zIndex: 0,
    borderRadius: '20px',
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  headerIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'linear-gradient(150deg, #1a4c35 0%, #2f7250 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 8px 14px rgba(26, 76, 53, 0.24)',
  },
  title: {
    margin: 0,
    fontSize: '40px',
    fontWeight: '700',
    color: '#eef8f1',
    letterSpacing: '-0.02em',
    lineHeight: '1.05',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#cde3d3',
    fontWeight: '500',
  },

  // Error Alert
  errorAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff5f5',
    border: '1px solid #f1cfcf',
    borderRadius: '12px',
    marginBottom: '18px',
  },
  errorIcon: {
    color: '#dc2626',
    flexShrink: 0,
    marginTop: '2px',
  },
  errorTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: '4px',
  },
  errorMessage: {
    fontSize: '13px',
    color: '#dc2626',
  },
  errorActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
  },
  retryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
  statusButton: {
    padding: '9px 14px',
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },

  // Loading State
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '56px 20px',
    backgroundColor: 'rgba(19, 57, 37, 0.5)',
    border: '1px solid rgba(172, 210, 187, 0.35)',
    borderRadius: '14px',
    backdropFilter: 'blur(6px)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #2f6d4a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#d4e7d9',
    fontSize: '14px',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '56px 20px',
    backgroundColor: 'rgba(19, 57, 37, 0.5)',
    border: '1px solid rgba(172, 210, 187, 0.35)',
    borderRadius: '14px',
    textAlign: 'center',
    backdropFilter: 'blur(6px)',
  },
  emptyIcon: {
    color: '#9db4a4',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#eaf6ee',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#cce1d2',
    maxWidth: '400px',
  },

  // Hero Card
  heroCard: {
    background:
      'linear-gradient(90deg, rgba(9, 35, 22, 0.86) 0%, rgba(11, 40, 25, 0.75) 42%, rgba(20, 52, 33, 0.36) 100%), url("/images/aloe3.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '18px',
    padding: '28px',
    marginBottom: '18px',
    boxShadow: '0 14px 28px rgba(14, 36, 24, 0.24)',
    border: '1px solid rgba(163, 196, 174, 0.38)',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(229, 245, 235, 0.92)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '10px',
  },
  heroStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '38px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '10px',
    lineHeight: '1',
  },
  heroDescription: {
    fontSize: '15px',
    color: 'rgba(234, 249, 239, 0.94)',
    lineHeight: '1.55',
    margin: 0,
    maxWidth: '720px',
    fontWeight: '400',
  },
  heroRight: {
    flexShrink: 0,
  },
  healthCircle: {
    position: 'relative',
    width: '124px',
    height: '124px',
    filter: 'drop-shadow(0 7px 12px rgba(10, 21, 15, 0.34))',
  },
  healthCircleSvg: {
    width: '100%',
    height: '100%',
  },
  healthPercentage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  healthValue: {
    fontSize: '30px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1',
  },
  healthLabel: {
    fontSize: '11px',
    color: 'rgba(225, 243, 231, 0.94)',
    marginTop: '4px',
    fontWeight: '500',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  statCard: {
    background: 'linear-gradient(165deg, rgba(187, 220, 199, 0.2) 0%, rgba(145, 184, 161, 0.24) 100%)',
    border: '1px solid rgba(170, 205, 184, 0.42)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 18px rgba(8, 27, 17, 0.2)',
    backdropFilter: 'blur(6px)',
  },
  statCardImage: {
    width: '100%',
    height: '160px',
    objectFit: 'contain',
    backgroundColor: '#e7f2ea',
    borderRadius: '10px',
    marginBottom: '12px',
    border: '1px solid #cfe0d4',
  },
  statCardImageScans: {
    backgroundColor: '#e2f3e8',
    borderColor: '#b9d8c3',
  },
  statCardImageDisease: {
    backgroundColor: '#f3e9de',
    borderColor: '#dcc4ad',
  },
  statCardImagePlants: {
    backgroundColor: '#e6efe4',
    borderColor: '#c5d7c1',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  statIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '9px',
    backgroundColor: '#e4efe7',
    color: '#2a6549',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrend: {
    color: '#428265',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#f0f8f2',
    marginBottom: '6px',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4e7da',
    marginBottom: '3px',
  },
  statFooter: {
    fontSize: '12px',
    color: '#c2d9ca',
    fontWeight: '400',
  },

  // Activity Section
  activitySection: {
    background: 'linear-gradient(180deg, rgba(178, 214, 191, 0.22) 0%, rgba(140, 180, 157, 0.24) 100%)',
    border: '1px solid rgba(168, 202, 181, 0.42)',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '18px',
    boxShadow: '0 10px 18px rgba(8, 27, 17, 0.2)',
    backdropFilter: 'blur(6px)',
  },
  activityHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  activityTitle: {
    margin: 0,
    fontSize: '34px',
    fontWeight: '700',
    color: '#eef8f1',
    letterSpacing: '-0.02em',
    lineHeight: '0.95',
  },
  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#1f7a46',
    color: '#ffffff',
    border: '1px solid #1f7a46',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activityList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
  },
  noActivityText: {
    fontSize: '14px',
    color: '#d0e4d5',
    padding: '10px 12px',
    fontWeight: '500',
  },
  activityItem: {
    display: 'block',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(173, 206, 186, 0.4)',
    background: 'linear-gradient(170deg, rgba(196, 225, 206, 0.18) 0%, rgba(146, 185, 162, 0.2) 100%)',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  activityImage: {
    width: '100%',
    height: '160px',
    objectFit: 'contain',
    backgroundColor: '#e8f2ea',
    borderRadius: '10px',
    marginBottom: '10px',
    border: '1px solid #cfddd3',
  },
  activityImageHealthy: {
    backgroundColor: '#e1f2e6',
    borderColor: '#b8d6c0',
  },
  activityImageAlert: {
    backgroundColor: '#f3e7df',
    borderColor: '#dcc3b2',
  },
  activityIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#eef8f2',
    marginTop: '10px',
    marginBottom: '3px',
  },
  activityMeta: {
    fontSize: '12px',
    color: '#c7dece',
    fontWeight: '400',
  },
  activityTime: {
    fontSize: '12px',
    color: '#bed6c6',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    display: 'block',
    marginTop: '10px',
  },

  // Quick Actions
  quickActions: {
    marginBottom: '8px',
  },
  quickActionsTitle: {
    margin: '0 0 12px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#eaf6ee',
    letterSpacing: '-0.02em',
  },
  quickActionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  quickActionCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'linear-gradient(165deg, rgba(191, 223, 202, 0.2) 0%, rgba(146, 185, 162, 0.22) 100%)',
    border: '1px solid rgba(170, 205, 184, 0.4)',
    borderRadius: '9px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 8px 14px rgba(8, 27, 17, 0.16)',
  },
  quickActionIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickActionText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#eaf6ee',
  },
  quickActionArrow: {
    color: '#cbe1d2',
    flexShrink: 0,
    width: '14px',
    height: '14px',
  },
}
