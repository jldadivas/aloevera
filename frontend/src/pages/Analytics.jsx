import React, { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  Download,
  FileText,
  HeartPulse,
  Leaf,
  Microscope,
  ShieldAlert,
  Timer
} from 'lucide-react'
import api, { API_BASE } from '../services/api'

const TAB_CONFIG = [
  { id: 'overview', label: 'Aloe Overview', icon: BarChart3 },
  { id: 'health', label: 'Aloe Health', icon: HeartPulse },
  { id: 'conditions', label: 'Aloe Conditions', icon: Microscope },
  { id: 'activity', label: 'Aloe Activity', icon: Activity }
]

const ProgressCircle = ({ value, max, label, color }) => {
  const percentage = (value / max) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
      <svg width="120" height="120" style={{ marginBottom: '8px' }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="#e4efe7" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
        />
        <text x="60" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>
          {percentage.toFixed(0)}%
        </text>
      </svg>
      <p style={{ margin: '0', fontSize: '12px', color: '#5b7865', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </p>
    </div>
  )
}

const MetricCard = ({ label, value, color, image, icon }) => (
  <article
    style={{
      background: '#ffffff',
      border: '1px solid #dceadf',
      borderRadius: '14px',
      boxShadow: '0 10px 22px rgba(17, 43, 28, 0.08)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 14px 28px rgba(17, 43, 28, 0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 10px 22px rgba(17, 43, 28, 0.08)'
    }}
  >
    <div
      style={{
        width: '100%',
        height: '156px',
        borderBottom: '1px solid #e6f0e7',
        background: '#f7fbf8',
        overflow: 'hidden'
      }}
    >
      <img
        src={image}
        alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
    <div style={{ padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#62806c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {label}
        </p>
        <span style={{ color }}>
          {icon}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '30px', lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 700, color }}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </p>
    </div>
  </article>
)

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const url = period === 'all'
        ? '/analytics/user'
        : `/analytics/user?period=${period}`
      const res = await api.get(url)
      setAnalytics(res.data?.data)
      setError(null)
    } catch (err) {
      if (!err.response) {
        setError(`Cannot reach backend at ${API_BASE}. Is the backend running?`)
      } else {
        setError(err.response?.data?.error || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 76px)', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)' }}>
        <div style={{ textAlign: 'center', color: '#2f5e43' }}>
          <Leaf size={38} style={{ marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 76px)', display: 'grid', placeItems: 'center', padding: '20px', background: 'linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)' }}>
        <div style={{ background: '#fff', border: '1px solid #f1cfcf', padding: '22px', borderRadius: '12px', maxWidth: '560px', textAlign: 'center', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#b91c1c', fontSize: '15px', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={loadAnalytics}
            style={{ padding: '10px 20px', background: '#1f7a46', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div style={{ minHeight: 'calc(100vh - 76px)', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)' }}>
        <p style={{ fontSize: '18px', color: '#365a45', margin: 0 }}>No analytics data available</p>
      </div>
    )
  }

  const data = analytics.analytics || {}
  const toConfidencePercent = (raw) => {
    const num = Number(raw)
    if (!Number.isFinite(num)) return 0
    if (num <= 1) return Math.max(0, Math.min(100, num * 100))
    if (num <= 10) return Math.max(0, Math.min(100, (num / 10) * 100))
    return Math.max(0, Math.min(100, num))
  }
  const safeData = {
    total_plants: data.total_plants || 0,
    total_scans: data.total_scans || 0,
    healthy_scans_count: data.healthy_scans_count || 0,
    diseased_scans_count: data.diseased_scans_count || 0,
    healthy_plants_count: data.healthy_plants_count || 0,
    diseased_plants_count: data.diseased_plants_count || 0,
    harvest_rate: parseFloat(data.harvest_rate) || 0,
    disease_rate: parseFloat(data.disease_rate) || 0,
    average_health_score: data.average_health_score !== undefined ? parseFloat(data.average_health_score) : 0,
    average_confidence_score: data.average_confidence_score !== undefined ? parseFloat(data.average_confidence_score) : 0,
    condition_distribution: data.condition_distribution || {},
    pest_distribution: data.pest_distribution || {},
    recent_scan_activity: data.recent_scan_activity || []
  }
  const averageConfidencePercent = toConfidencePercent(safeData.average_confidence_score)
  const hiddenConditionKeys = new Set(['rust'])
  const allConditionEntries = Object.entries(safeData.condition_distribution || {})
  const visibleConditionEntries = allConditionEntries.filter(
    ([condition]) => !hiddenConditionKeys.has(String(condition || '').toLowerCase())
  )

  const metricImages = {
    totalPlants: '/images/total%20plants%20.png',
    totalScans: '/images/total%20scans.png',
    healthyPlants: '/images/healthy%20plants%20.png',
    diseasedPlants: '/images/disease%20rate.png',
    harvestRate: '/images/disease%20rate.png',
    diseaseRate: '/images/disease%20rate.png',
    avgHealth: '/images/Avg%20Health%20Score.png',
    avgConfidence: '/images/Avg%20Confidence.png'
  }

  const getScanConditionLabel = (scan) => {
    const analysis = scan.analysis_result || {}
    const normalize = (value = '') => String(value).toLowerCase().trim().replace(/[-\s]+/g, '_')
    const healthyMarkers = new Set(['', 'healthy', 'none', 'normal', 'no_disease', 'no_issue', 'clear'])
    const isHealthy = (value = '') => healthyMarkers.has(normalize(value))

    const conditions = Array.isArray(analysis.detected_conditions) ? analysis.detected_conditions : []
    const flaggedConditions = conditions.filter((item) => !isHealthy(item))
    if (flaggedConditions.length > 0) return flaggedConditions.join(', ')

    const diseaseName = analysis.disease_name
    if (diseaseName && !isHealthy(diseaseName)) return diseaseName

    const hasDisease = analysis.disease_detected === true ||
      (analysis.disease_severity && analysis.disease_severity !== 'none')
    return hasDisease ? 'Diseased' : 'Healthy'
  }

  const exportCsv = () => {
    const rows = []
    const pushRow = (section, item, value, extra1 = '', extra2 = '') => rows.push({ section, item, value, extra1, extra2 })

    pushRow('Overview', 'Period', period)
    pushRow('Overview', 'Total Plants', safeData.total_plants)
    pushRow('Overview', 'Total Scans', safeData.total_scans)
    pushRow('Overview', 'Healthy Scans', safeData.healthy_scans_count)
    pushRow('Overview', 'Diseased Scans', safeData.diseased_scans_count)
    pushRow('Overview', 'Harvest Rate', `${safeData.harvest_rate.toFixed(2)}%`)
    pushRow('Overview', 'Disease Rate', `${safeData.disease_rate.toFixed(2)}%`)
    pushRow('Overview', 'Average Health Score', safeData.average_health_score.toFixed(2))
    pushRow('Overview', 'Average Confidence Score', `${averageConfidencePercent.toFixed(2)}%`)

    visibleConditionEntries.forEach(([condition, count]) => {
      pushRow('Condition Distribution', condition.replace(/_/g, ' '), count)
    })
    Object.entries(safeData.pest_distribution || {}).forEach(([pest, count]) => {
      pushRow('Pest Distribution', pest.replace(/_/g, ' '), count)
    })
    ;(safeData.recent_scan_activity || []).forEach((scan) => {
      const healthScore = parseFloat(scan.analysis_result?.health_score ?? scan.analysis_result?.plant_health_score ?? 0).toFixed(2)
      pushRow(
        'Recent Scan Activity',
        scan.plant_id?.plant_id || 'N/A',
        healthScore,
        getScanConditionLabel(scan),
        new Date(scan.createdAt).toLocaleDateString()
      )
    })

    const headers = ['section', 'item', 'value', 'extra1', 'extra2']
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const metricsRows = [
      ['Period', period],
      ['Total Aloe Plants', safeData.total_plants],
      ['Total Aloe Scans', safeData.total_scans],
      ['Healthy Aloe Scans', safeData.healthy_scans_count],
      ['Diseased Aloe Scans', safeData.diseased_scans_count],
      ['Aloe Harvest Rate', `${safeData.harvest_rate.toFixed(2)}%`],
      ['Aloe Disease Rate', `${safeData.disease_rate.toFixed(2)}%`],
      ['Average Aloe Health Score', safeData.average_health_score.toFixed(2)],
      ['Average Aloe Confidence Score', `${averageConfidencePercent.toFixed(2)}%`]
    ]
    const conditionRows = visibleConditionEntries
    const pestRows = Object.entries(safeData.pest_distribution || {})
    const activityRows = (safeData.recent_scan_activity || []).map((scan) => {
      const location = scan.plant_id?.location
        ? (scan.plant_id.location.farm_name || scan.plant_id.location.plot_number || 'Home')
        : 'N/A'
      const score = parseFloat(scan.analysis_result?.health_score ?? scan.analysis_result?.plant_health_score ?? 0).toFixed(2)
      return [
        scan.plant_id?.plant_id || 'N/A',
        location,
        score,
        getScanConditionLabel(scan),
        new Date(scan.createdAt).toLocaleDateString()
      ]
    })

    const interpretationPoints = [
      `Aloe scan status: ${safeData.healthy_scans_count} healthy scans and ${safeData.diseased_scans_count} diseased scans were recorded for the selected period.`,
      `Aloe disease pressure: Disease rate is ${safeData.disease_rate.toFixed(2)}%, while harvest rate is ${safeData.harvest_rate.toFixed(2)}%.`,
      `Aloe quality confidence: Average health score is ${safeData.average_health_score.toFixed(2)} / 100 and average confidence score is ${averageConfidencePercent.toFixed(2)}%.`,
      `Aloe operational activity: ${safeData.total_scans} total aloe scans were recorded for the selected period (${period}).`
    ]

    const buildTable = (headers, rows) => {
      const headHtml = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`
      const bodyHtml = rows.length
        ? rows.map((r) => `<tr>${r.map((c) => `<td>${String(c)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${headers.length}">No data available</td></tr>`
      return `<table>${headHtml}${bodyHtml}</table>`
    }
    const logoUrl = `${window.location.origin}/images/system-logo.png`

    const html = `
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #eef5f0;
              color: #13281d;
              padding: 28px;
            }
            .report {
              max-width: 980px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #d8e6dc;
              border-radius: 14px;
              overflow: hidden;
              box-shadow: 0 10px 24px rgba(17, 43, 28, 0.08);
            }
            .report-head {
              background: linear-gradient(135deg, #1f7a46 0%, #2f7250 100%);
              color: #ffffff;
              padding: 18px 22px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand img {
              width: 42px;
              height: 42px;
              border-radius: 10px;
              object-fit: cover;
              border: 2px solid rgba(255, 255, 255, 0.35);
            }
            .brand h1 {
              margin: 0;
              font-size: 22px;
              line-height: 1.15;
              letter-spacing: -0.01em;
            }
            .brand p {
              margin: 3px 0 0 0;
              font-size: 12px;
              color: #d6eadf;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #d6eadf;
              line-height: 1.5;
            }
            .body {
              padding: 18px 22px 24px;
            }
            h2 {
              margin: 20px 0 8px;
              font-size: 16px;
              color: #1f3e2f;
              letter-spacing: 0.01em;
            }
            h2:first-child {
              margin-top: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              border: 1px solid #d9e7dd;
              border-radius: 8px;
              overflow: hidden;
            }
            th, td {
              border: 1px solid #d9e7dd;
              padding: 8px 10px;
              font-size: 12px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #e8f2eb;
              color: #1f3e2f;
              font-weight: 700;
            }
            tr:nth-child(even) td {
              background: #f7fbf8;
            }
            .foot {
              margin-top: 14px;
              font-size: 11px;
              color: #67816f;
              text-align: right;
            }
            .interpretation {
              margin-top: 18px;
              border: 1px solid #d8e6dc;
              background: #f5faf6;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .interpretation h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #1f3e2f;
            }
            .interpretation ul {
              margin: 0;
              padding-left: 18px;
            }
            .interpretation li {
              margin: 5px 0;
              font-size: 12px;
              color: #365645;
              line-height: 1.45;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-head">
              <div class="brand">
                <img src="${logoUrl}" alt="Vera System Logo" />
                <div>
                  <h1>Aloe Vera Analytics Report</h1>
                  <p>Vera Aloe Vera System</p>
                </div>
              </div>
              <div class="meta">
                <div>Period: ${period}</div>
                <div>Generated: ${new Date().toLocaleString()}</div>
              </div>
            </div>
            <div class="body">
              <h2>Aloe Overview</h2>
              ${buildTable(['Metric', 'Value'], metricsRows)}
              <h2>Aloe Condition Distribution</h2>
              ${buildTable(['Aloe Condition', 'Count'], conditionRows.map(([k, v]) => [k.replace(/_/g, ' '), v]))}
              <h2>Aloe Pest Distribution</h2>
              ${buildTable(['Aloe Pest', 'Count'], pestRows.map(([k, v]) => [k.replace(/_/g, ' '), v]))}
              <h2>Recent Aloe Scan Activity</h2>
              ${buildTable(['Aloe Plant ID', 'Location', 'Aloe Health Score', 'Aloe Conditions', 'Date'], activityRows)}
              <div class="interpretation">
                <h3>Aloe Interpretation</h3>
                <ul>
                  ${interpretationPoints.map((point) => `<li>${point}</li>`).join('')}
                </ul>
              </div>
              <div class="foot">Generated by Vera Aloe Vera System Analytics</div>
            </div>
          </div>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 76px)', background: 'linear-gradient(180deg, #edf6ec 0%, #f6fbf5 100%)', padding: '20px 16px 28px' }}>
      <div style={{ maxWidth: '1420px', margin: '0 auto' }}>
        <section style={{ borderRadius: '16px', border: '1px solid #d7e7da', background: '#fff', boxShadow: '0 16px 28px rgba(17, 43, 28, 0.09)', padding: '18px' }}>
          <header style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h1 style={{ margin: '0 0 4px 0', color: '#1f3e2f', fontSize: '31px', lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 700 }}>
                  Analytics Dashboard
                </h1>
                <p style={{ margin: 0, color: '#5f7f69', fontSize: '13px', fontWeight: 600 }}>
                  Monitor plant health, conditions, and scan performance across periods.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={exportCsv}
                  style={{ padding: '10px 14px', background: '#e7f2ea', color: '#2a6549', border: '1px solid #cfe0d4', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={15} />
                  Export CSV
                </button>
                <button
                  onClick={exportPdf}
                  style={{ padding: '10px 14px', background: '#1f7a46', color: '#fff', border: '1px solid #1f7a46', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileText size={15} />
                  Export PDF
                </button>
              </div>
            </div>
          </header>

          <div style={{ marginBottom: '14px', borderRadius: '12px', background: 'linear-gradient(150deg, #1a4c35 0%, #2f7250 100%)', border: '1px solid rgba(173, 206, 186, 0.35)', padding: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'daily', 'weekly', 'monthly'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '9px 15px',
                      background: period === p ? '#e4efe7' : 'rgba(190, 222, 201, 0.16)',
                      color: period === p ? '#2a6549' : '#f0f8f2',
                      border: period === p ? '1px solid #b9d8c3' : '1px solid rgba(173, 206, 186, 0.34)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textTransform: 'capitalize'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ color: '#cde3d3', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Timer size={14} />
                Current period: {period}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #e2eee5', paddingBottom: '2px', flexWrap: 'wrap' }}>
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '11px 14px',
                    background: active ? '#e4efe7' : 'transparent',
                    color: active ? '#2a6549' : '#5c7864',
                    border: 'none',
                    borderBottom: active ? '2px solid #2f7250' : '2px solid transparent',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px'
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.28s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <MetricCard label="Total Aloe Scans" value={safeData.total_scans} color="#2a6549" image={metricImages.totalScans} icon={<BarChart3 size={16} />} />
                <MetricCard label="Healthy Aloe Scans" value={safeData.healthy_scans_count} color="#1f7a46" image={metricImages.healthyPlants} icon={<HeartPulse size={16} />} />
                <MetricCard label="Diseased Aloe Scans" value={safeData.diseased_scans_count} color="#b45309" image={metricImages.diseasedPlants} icon={<ShieldAlert size={16} />} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: '14px' }}>
                <MetricCard label="Aloe Disease Rate" value={`${safeData.disease_rate.toFixed(1)}%`} color="#9a3412" image={metricImages.diseaseRate} icon={<ShieldAlert size={16} />} />
                <MetricCard label="Avg Aloe Health Score" value={safeData.average_health_score.toFixed(2)} color="#1f7a46" image={metricImages.avgHealth} icon={<HeartPulse size={16} />} />
                <MetricCard label="Avg Aloe Confidence" value={`${averageConfidencePercent.toFixed(1)}%`} color="#2a6549" image={metricImages.avgConfidence} icon={<Microscope size={16} />} />
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div style={{ animation: 'fadeIn 0.28s ease', borderRadius: '12px', border: '1px solid #dceadf', background: '#f9fcf8', padding: '18px' }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#1f3e2f', fontSize: '23px', fontWeight: 700 }}>Aloe Vera Health Metrics</h2>
              <div style={{ display: 'flex', gap: '26px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <ProgressCircle value={safeData.healthy_plants_count} max={safeData.total_plants || 1} label="Healthy Aloe" color="#1f7a46" />
                <ProgressCircle value={safeData.diseased_plants_count} max={safeData.total_plants || 1} label="Diseased Aloe" color="#b45309" />
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ color: '#2b4b39', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Health Overview</h3>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#587564', fontSize: '13px', fontWeight: 600 }}>Average Health Score</span>
                      <span style={{ fontWeight: 700, color: '#1f7a46' }}>{safeData.average_health_score.toFixed(2)}/100</span>
                    </div>
                    <div style={{ background: '#e3eee6', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, #1f7a46 0%, #2f7250 100%)', height: '100%', width: `${Math.min((safeData.average_health_score / 100) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#587564', fontSize: '13px', fontWeight: 600 }}>Average Confidence Score</span>
                      <span style={{ fontWeight: 700, color: '#2a6549' }}>{averageConfidencePercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ background: '#e3eee6', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, #2a6549 0%, #1f7a46 100%)', height: '100%', width: `${averageConfidencePercent}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conditions' && (
            <div style={{ animation: 'fadeIn 0.28s ease', borderRadius: '12px', border: '1px solid #dceadf', background: '#f9fcf8', padding: '18px' }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#1f3e2f', fontSize: '23px', fontWeight: 700 }}>Aloe Conditions & Pests</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <h3 style={{ marginBottom: '12px', color: '#2b4b39', fontSize: '16px', fontWeight: 700 }}>Condition Distribution</h3>
                  {visibleConditionEntries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {visibleConditionEntries.map(([condition, count]) => (
                        <div key={condition} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', background: '#fff', border: '1px solid #dceadf', borderRadius: '8px' }}>
                          <span style={{ color: '#466552', textTransform: 'capitalize', fontSize: '14px', fontWeight: 600 }}>{condition.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 700, color: '#1f7a46', fontSize: '16px' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6a8573', textAlign: 'center' }}>No condition data available</p>
                  )}
                </div>

                <div>
                  <h3 style={{ marginBottom: '12px', color: '#2b4b39', fontSize: '16px', fontWeight: 700 }}>Pest Distribution</h3>
                  {Object.entries(safeData.pest_distribution || {}).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.entries(safeData.pest_distribution).map(([pest, count]) => (
                        <div key={pest} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', background: '#fff', border: '1px solid #dceadf', borderRadius: '8px' }}>
                          <span style={{ color: '#466552', textTransform: 'capitalize', fontSize: '14px', fontWeight: 600 }}>{pest.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 700, color: '#1f7a46', fontSize: '16px' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6a8573', textAlign: 'center' }}>No pest data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ animation: 'fadeIn 0.28s ease' }}>
              {safeData.recent_scan_activity && safeData.recent_scan_activity.length > 0 ? (
                <div style={{ borderRadius: '12px', border: '1px solid #dceadf', background: '#f9fcf8', padding: '18px', overflowX: 'auto' }}>
                  <h2 style={{ margin: '0 0 16px 0', color: '#1f3e2f', fontSize: '23px', fontWeight: 700 }}>Recent Aloe Scan Activity</h2>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #1f7a46 0%, #185f38 100%)', color: '#fff' }}>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>Plant ID</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>Location</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>Health Score</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>Conditions</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeData.recent_scan_activity.map((scan, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: '1px solid #e2eee5', background: idx % 2 === 0 ? '#fff' : '#f7fbf6' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#eef6ef' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f7fbf6' }}
                        >
                          <td style={{ padding: '13px', fontSize: '13px', color: '#2f4f3d', fontWeight: 600 }}>{scan.plant_id?.plant_id || 'N/A'}</td>
                          <td style={{ padding: '13px', fontSize: '13px', color: '#2f4f3d' }}>
                            {scan.plant_id?.location
                              ? (scan.plant_id.location.farm_name || scan.plant_id.location.plot_number || 'Home')
                              : 'N/A'}
                          </td>
                          <td style={{ padding: '13px' }}>
                            <span style={{ display: 'inline-block', padding: '5px 10px', borderRadius: '999px', background: '#e7f2ea', color: '#2a6549', fontWeight: 700, fontSize: '12px', border: '1px solid #cfe0d4' }}>
                              {parseFloat(scan.analysis_result?.health_score ?? scan.analysis_result?.plant_health_score ?? 0).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ padding: '13px', fontSize: '13px', color: '#45624f' }}>{getScanConditionLabel(scan)}</td>
                          <td style={{ padding: '13px', fontSize: '13px', color: '#567261' }}>{new Date(scan.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ borderRadius: '12px', border: '1px solid #dceadf', background: '#f9fcf8', padding: '34px', textAlign: 'center' }}>
                  <p style={{ color: '#6a8573', margin: 0, fontSize: '16px' }}>No recent scan activity</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
