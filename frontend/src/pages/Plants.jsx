import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Plants() {
  const navigate = useNavigate()
  const [plants, setPlants] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [plantScans, setPlantScans] = useState([])
  const [allScans, setAllScans] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [treatmentLoading, setTreatmentLoading] = useState(false)
  const [treatmentError, setTreatmentError] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState(null)
  const [expandedScanId, setExpandedScanId] = useState(null)
  const treatmentStoragePrefix = 'vera:treatment-progress'

  const normalizeId = (value) => {
    if (value === null || value === undefined) return null
    return String(value)
  }

  const toBoolean = (value) => {
    if (value === true || value === false) return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
    return false
  }

  const getPlantIdCandidates = (plant) => {
    const candidates = []
    const mongoId = normalizeId(plant?._id)
    const customId = normalizeId(plant?.plant_id)
    if (mongoId) candidates.push(mongoId)
    if (customId) candidates.push(customId)
    return candidates
  }

  const getScanPlantId = (scan) => {
    if (!scan || !scan.plant_id) return null
    if (typeof scan.plant_id === 'string') return normalizeId(scan.plant_id)
    return normalizeId(
      scan.plant_id._id ||
      scan.plant_id.id ||
      scan.plant_id.plant_id ||
      scan.plant_id
    )
  }

  const getPlantForScan = (scan) => {
    const scanPlantId = getScanPlantId(scan)
    if (!scanPlantId) return null
    return plants.find((p) =>
      normalizeId(p?._id) === scanPlantId || normalizeId(p?.plant_id) === scanPlantId
    ) || null
  }

  const scanBelongsToPlant = (scan, plant) => {
    const scanPlantId = getScanPlantId(scan)
    if (!scanPlantId) return false
    const candidates = getPlantIdCandidates(plant)
    return candidates.some((id) => id === scanPlantId)
  }

  const getPlantIsDiseased = (plant) => {
    const latestScan = allScans
      .filter((s) => scanBelongsToPlant(s, plant))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

    if (latestScan) return toBoolean(latestScan.analysis_result?.disease_detected)
    if (plant.current_status) {
      const severity = plant.current_status.disease_severity?.toLowerCase() || 'none'
      return severity !== 'none' && severity !== 'unknown'
    }
    return false
  }

  const getLatestScanForPlant = (plantId) => {
    const normalizedPlantId = normalizeId(plantId)
    const plant = plants.find((p) => normalizeId(p?._id) === normalizedPlantId || normalizeId(p?.plant_id) === normalizedPlantId)
    const candidates = plant ? getPlantIdCandidates(plant) : [normalizedPlantId]
    return allScans
      .filter((s) => candidates.includes(getScanPlantId(s)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
  }

  const getScanCountForPlant = (plantId) => {
    const normalizedPlantId = normalizeId(plantId)
    const plant = plants.find((p) => normalizeId(p?._id) === normalizedPlantId || normalizeId(p?.plant_id) === normalizedPlantId)
    const candidates = plant ? getPlantIdCandidates(plant) : [normalizedPlantId]
    return allScans.filter((s) => candidates.includes(getScanPlantId(s))).length
  }

  const getScanDiseaseName = (scan) => {
    if (!scan?.analysis_result) return 'No scan yet'
    if (toBoolean(scan.analysis_result.disease_detected)) {
      return scan.analysis_result.disease_name || 'Unknown disease'
    }
    return 'Healthy'
  }

  const getDisplayAge = (plant) => {
    const plantId = normalizeId(plant?._id)
    const latestModalScan = normalizeId(selectedPlant?._id) === plantId
      ? [...plantScans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      : null
    const latestScan = latestModalScan || getLatestScanForPlant(plantId)
    const aiAge = latestScan?.analysis_result?.estimated_age_months
    const aiAgeFormatted = latestScan?.analysis_result?.estimated_age_formatted
    if (typeof aiAgeFormatted === 'string' && aiAgeFormatted.trim()) {
      return `${aiAgeFormatted.trim()} (AI)`
    }
    if (typeof aiAge === 'number' && Number.isFinite(aiAge)) {
      return `${aiAge.toFixed(1)} months (AI)`
    }

    if (typeof plant?.age_in_months === 'number' && Number.isFinite(plant.age_in_months)) {
      return `${plant.age_in_months.toFixed(1)} months`
    }

    return 'N/A'
  }

  const getLatestAnalysisForPlant = (plant) => {
    if (!plant?._id) return null
    const normalizedPlantId = normalizeId(plant._id)
    const modalScan = normalizeId(selectedPlant?._id) === normalizedPlantId
      ? [...plantScans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      : null
    const latestScan = modalScan || getLatestScanForPlant(normalizedPlantId)
    return latestScan?.analysis_result || null
  }

  const getLatestAnalysisForPlantId = (plantId) => {
    if (!plantId) return null
    const latestScan = getLatestScanForPlant(plantId)
    return latestScan?.analysis_result || null
  }

  const normalizeDiseaseKey = (value) => {
    if (!value) return ''
    return String(value)
      .trim()
      .toLowerCase()
      .replaceAll('-', '_')
      .replace(/\s+/g, '_')
  }

  const resolveDiseaseKey = (analysis, scan) => {
    const detected = Array.isArray(analysis?.detected_conditions)
      ? analysis.detected_conditions.find((item) => normalizeDiseaseKey(item) !== 'healthy')
      : null
    const normalizedDetected = normalizeDiseaseKey(detected)
    if (normalizedDetected) return normalizedDetected

    const fromName = normalizeDiseaseKey(analysis?.disease_name)
    if (fromName && fromName !== 'healthy') return fromName

    const fromRecommendation = normalizeDiseaseKey(scan?.analysis_result?.disease_name)
    if (fromRecommendation && fromRecommendation !== 'healthy') return fromRecommendation

    return ''
  }

  const getDiseaseLookupKeys = (diseaseKey) => {
    const base = normalizeDiseaseKey(diseaseKey)
    if (!base) return []

    const keys = [base]
    const compact = base.replaceAll('_', '')
    if (compact && compact !== base) keys.push(compact)

    const aliases = {
      mealy_bug: 'mealybug',
      mealy_bugs: 'mealybug',
      spidermite: 'spider_mite',
      spidermites: 'spider_mite',
      spider_mites: 'spider_mite',
      scale_insects: 'scale_insect'
    }
    if (aliases[base] && !keys.includes(aliases[base])) {
      keys.push(aliases[base])
    }

    return [...new Set(keys)]
  }

  const getLocalTreatmentStepsByDisease = (diseaseKey, severityValue) => {
    const key = normalizeDiseaseKey(diseaseKey)
    if (!key) return []
    const severity = mapSeverityForTreatment(severityValue)

    const planMap = {
      leaf_spot: [
        'Remove leaves with visible dark spots',
        'Improve airflow around the plant canopy',
        'Avoid wetting leaves during watering',
        'Apply a fungicide appropriate for leaf spot',
        'Rescan after 7 days and compare progression'
      ],
      root_rot: [
        'Stop watering temporarily and let soil dry',
        'Check roots and trim soft or blackened roots',
        'Repot using clean, fast-draining medium',
        'Disinfect tools and affected container area',
        'Resume light watering only when top soil is dry'
      ],
      sunburn: [
        'Move plant to bright but indirect light',
        'Remove severely scorched leaf tissue',
        'Increase acclimation gradually before full sun',
        'Avoid midday direct exposure',
        'Monitor new growth for recovery signs'
      ],
      aloe_rust: [
        'Prune leaves with orange-brown pustules',
        'Keep foliage dry and improve ventilation',
        'Apply rust-targeted fungicide treatment',
        'Sanitize pruning tools after each cut',
        'Rescan in 3-7 days to confirm improvement'
      ],
      bacterial_soft_rot: [
        'Remove mushy infected tissue immediately',
        'Reduce watering and improve drainage',
        'Isolate plant to avoid spread',
        'Apply suitable antibacterial control if available',
        'Disinfect tools, pots, and working area'
      ],
      anthracnose: [
        'Prune leaves with sunken dark lesions',
        'Avoid overhead irrigation on foliage',
        'Apply broad-spectrum fungicide program',
        'Increase spacing for better airflow',
        'Monitor lesion spread every 2-3 days'
      ],
      fungal_disease: [
        'Remove visibly infected parts of the plant',
        'Improve air movement and reduce humidity',
        'Apply an antifungal treatment as directed',
        'Keep foliage dry during watering',
        'Rescan after one treatment cycle'
      ],
      mealybug: [
        'Isolate the infested plant from healthy plants',
        'Wipe mealybug clusters with cotton and alcohol solution',
        'Remove heavily infested leaves or sections',
        'Apply insecticidal soap or neem-based spray',
        'Repeat treatment every 3-7 days and inspect nearby plants'
      ],
      spider_mite: [
        'Isolate the plant and inspect leaf undersides',
        'Rinse leaves to reduce mite population',
        'Remove heavily damaged leaves',
        'Apply miticide or insecticidal soap thoroughly',
        'Repeat application after 3-5 days and rescan'
      ],
      scale_insect: [
        'Isolate affected plant from the batch',
        'Manually remove visible scale insects',
        'Prune heavily infested plant parts',
        'Apply horticultural oil or insecticidal control',
        'Recheck in 5-7 days and repeat if needed'
      ]
    }

    const base = planMap[key] || []
    if (base.length === 0) return []

    if (severity === 'severe') {
      return [
        ...base,
        'Perform strict daily monitoring until symptoms decline'
      ]
    }

    if (severity === 'mild') {
      return base.slice(0, 4).concat('Continue close observation for at least 7 days')
    }

    return base
  }

  const mapSeverityForTreatment = (severityValue) => {
    const normalized = String(severityValue || '').toLowerCase()
    if (normalized === 'high') return 'severe'
    if (normalized === 'low') return 'mild'
    if (['mild', 'moderate', 'severe'].includes(normalized)) return normalized
    return 'moderate'
  }

  const getTreatmentStorageKey = (plantId, diseaseKey) => {
    const normalizedPlantId = normalizeId(plantId)
    const normalizedDisease = normalizeDiseaseKey(diseaseKey)
    if (!normalizedPlantId || !normalizedDisease) return ''
    return `${treatmentStoragePrefix}:${normalizedPlantId}:${normalizedDisease}`
  }

  const loadAllScans = async () => {
    try {
      const limit = 100
      let page = 1
      let pages = 1
      const all = []

      while (page <= pages) {
        const res = await api.get('/scans', { params: { page, limit } })
        const scansData = res.data?.data?.scans || []
        if (Array.isArray(scansData)) {
          all.push(...scansData)
        }
        pages = Number(res.data?.pages || 1)
        page += 1
      }

      setAllScans(all)
      return all
    } catch (err) {
      console.log('Error loading scans:', err)
      return []
    }
  }

  const loadTreatmentProgress = (plantId, diseaseKey) => {
    try {
      const storageKey = getTreatmentStorageKey(plantId, diseaseKey)
      if (!storageKey) return null
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed?.steps) || typeof parsed?.checked !== 'object') return null
      return parsed
    } catch {
      return null
    }
  }

  const saveTreatmentProgress = (plan) => {
    try {
      if (!plan?.plantId || !plan?.diseaseKey) return
      const storageKey = getTreatmentStorageKey(plan.plantId, plan.diseaseKey)
      if (!storageKey) return
      localStorage.setItem(storageKey, JSON.stringify({
        plantId: plan.plantId,
        diseaseKey: normalizeDiseaseKey(plan.diseaseKey),
        diseaseLabel: plan.diseaseLabel || '',
        steps: Array.isArray(plan.steps) ? plan.steps : [],
        checked: plan.checked || {},
        updatedAt: new Date().toISOString()
      }))
    } catch {
      // Ignore storage errors
    }
  }

  const getFallbackTreatmentSteps = (scan) => {
    if (Array.isArray(scan?.recommendations)) return scan.recommendations
    if (Array.isArray(scan?.recommendations?.treatment_plan)) return scan.recommendations.treatment_plan
    if (Array.isArray(scan?.analysis_result?.recommendations?.treatment_plan)) return scan.analysis_result.recommendations.treatment_plan
    return []
  }

  const startTreatmentFlow = async (plantId, latestScan, latestAnalysis) => {
    if (!plantId) return

    await applyPlantAction(plantId, latestScan, 'start_treatment', 'Treatment workflow started.')

    const diseaseKey = resolveDiseaseKey(latestAnalysis, latestScan)
    const severity = mapSeverityForTreatment(latestAnalysis?.disease_severity)
    const fallbackSteps = getFallbackTreatmentSteps(latestScan)

    try {
      setTreatmentLoading(true)
      setTreatmentError('')

      let steps = fallbackSteps
      let diseaseLabel = latestAnalysis?.disease_name || diseaseKey || 'Detected condition'

      if (diseaseKey) {
        const lookupKeys = getDiseaseLookupKeys(diseaseKey)
        for (const key of lookupKeys) {
          try {
            const res = await api.get(`/diseases/${key}/treatment`, { params: { severity } })
            const treatment = res.data?.data?.treatment
            if (Array.isArray(treatment?.treatment) && treatment.treatment.length > 0) {
              steps = treatment.treatment
              diseaseLabel = treatment?.disease || diseaseLabel
              break
            }
          } catch {
            // Try next alias
          }
        }
      }

      if ((!Array.isArray(steps) || steps.length === 0) && diseaseKey) {
        steps = getLocalTreatmentStepsByDisease(diseaseKey, latestAnalysis?.disease_severity)
      }

      if (!Array.isArray(steps) || steps.length === 0) {
        setTreatmentPlan(null)
        setTreatmentError('No treatment steps found for this disease yet.')
        return
      }

      const savedProgress = loadTreatmentProgress(plantId, diseaseKey)
      const restoredChecked = (savedProgress && Array.isArray(savedProgress.steps) && savedProgress.steps.length === steps.length)
        ? (savedProgress.checked || {})
        : {}

      setTreatmentPlan({
        plantId,
        diseaseKey,
        diseaseLabel,
        steps,
        checked: restoredChecked
      })
    } catch (err) {
      if (fallbackSteps.length > 0) {
        const savedProgress = loadTreatmentProgress(plantId, diseaseKey)
        const restoredChecked = (savedProgress && Array.isArray(savedProgress.steps) && savedProgress.steps.length === fallbackSteps.length)
          ? (savedProgress.checked || {})
          : {}
        setTreatmentPlan({
          plantId,
          diseaseKey,
          diseaseLabel: latestAnalysis?.disease_name || diseaseKey || 'Detected condition',
          steps: fallbackSteps,
          checked: restoredChecked
        })
        setTreatmentError('Loaded fallback treatment steps because disease knowledge service is unavailable.')
      } else {
        setTreatmentPlan(null)
        setTreatmentError(err.response?.data?.error || err.message || 'Failed to load treatment steps.')
      }
    } finally {
      setTreatmentLoading(false)
    }
  }

  const toggleTreatmentStep = (stepIndex) => {
    setTreatmentPlan((prev) => {
      if (!prev) return prev
      const nextPlan = {
        ...prev,
        checked: {
          ...prev.checked,
          [stepIndex]: !prev.checked?.[stepIndex]
        }
      }
      saveTreatmentProgress(nextPlan)
      return nextPlan
    })
  }

  const restoreTreatmentFromStorageForPlant = (plant) => {
    const plantId = normalizeId(plant?._id)
    if (!plantId) return

    const latestScan = getLatestScanForPlant(plantId)
    const latestAnalysis = getLatestAnalysisForPlantId(plantId)
    const diseaseKey = resolveDiseaseKey(latestAnalysis, latestScan)
    if (!diseaseKey) return

    const lookupKeys = getDiseaseLookupKeys(diseaseKey)
    let saved = null
    let matchedKey = diseaseKey
    for (const key of lookupKeys) {
      const record = loadTreatmentProgress(plantId, key)
      if (record) {
        saved = record
        matchedKey = key
        break
      }
    }
    if (!saved) return

    setTreatmentPlan({
      plantId,
      diseaseKey: matchedKey,
      diseaseLabel: saved.diseaseLabel || latestAnalysis?.disease_name || matchedKey,
      steps: saved.steps,
      checked: saved.checked || {}
    })
  }

  const applyPlantAction = async (plantId, latestScan, action, note) => {
    if (!plantId) return
    try {
      setActionLoading(true)
      setActionError('')
      setActionSuccess('')
      await api.put(`/plants/${plantId}/action`, {
        action,
        note,
        photo_url: latestScan?.image_data?.original_url || ''
      })

      const plantRes = await api.get(`/plants/${plantId}`)
      const updatedPlant = plantRes.data?.data?.plant
      if (updatedPlant) {
        setPlants((prev) => prev.map((p) => (p._id === plantId ? updatedPlant : p)))
        if (selectedPlant?._id === plantId) setSelectedPlant(updatedPlant)
      }

      setActionSuccess(`Action saved: ${note}`)
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to apply action')
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    document.body.classList.add('plants-no-bg')
    return () => {
      document.body.classList.remove('plants-no-bg')
    }
  }, [])

  useEffect(() => {
    const loadAllPlants = async () => {
      try {
        const limit = 100
        let page = 1
        let pages = 1
        const allPlants = []

        while (page <= pages) {
          const res = await api.get('/plants', { params: { page, limit } })
          const pagePlants = res.data?.data?.plants || []
          allPlants.push(...pagePlants)
          pages = Number(res.data?.pages || 1)
          page += 1
        }

        setPlants(allPlants)
      } catch (err) {
        setError(err.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAllPlants()

    loadAllScans()
  }, [])

  useEffect(() => {
    if (selectedPlant && showModal) {
      api.get(`/scans/plant/${selectedPlant._id}`, { params: { page: 1, limit: 100 } })
        .then((res) => {
          const scans = res.data?.data?.scans || []
          setPlantScans(scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        })
        .catch((err) => console.log('Error fetching scans:', err))
    }
  }, [selectedPlant, showModal])

  const togglePlantDetails = (plant, scanId) => {
    if (expandedScanId === scanId) {
      setExpandedScanId(null)
      setShowModal(false)
      setSelectedPlant(null)
      setActionError('')
      setActionSuccess('')
      setTreatmentError('')
      setTreatmentPlan(null)
      return
    }
    setExpandedScanId(scanId)
    if (plant) {
      setSelectedPlant(plant)
      restoreTreatmentFromStorageForPlant(plant)
    } else {
      setSelectedPlant(null)
    }
    setActionError('')
    setActionSuccess('')
    setTreatmentError('')
    setTreatmentPlan(null)
    setShowModal(true)
  }

  const sortedScans = [...allScans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const totalScansCount = allScans.length
  const issuesCount = allScans.filter((scan) => toBoolean(scan?.analysis_result?.disease_detected)).length
  const healthyCount = Math.max(0, totalScansCount - issuesCount)
  const filteredScans = sortedScans.filter((scan) => {
    if (activeFilter === 'healthy') return !toBoolean(scan?.analysis_result?.disease_detected)
    if (activeFilter === 'issues') return toBoolean(scan?.analysis_result?.disease_detected)
    return true
  })

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M8 12a15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4 10" />
              <path d="M8 12a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0 4-10" />
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>Aloe Vera Management</h1>
            <p style={styles.subtitle}>Monitor and manage your registered aloe plants.</p>
          </div>
        </header>

        {!loading && !error && plants.length > 0 && (
          <div style={styles.statsBar}>
            <StatCard
              label="Total Scans"
              value={totalScansCount}
              tone="all"
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <StatCard
              label="Healthy"
              value={healthyCount}
              tone="healthy"
              active={activeFilter === 'healthy'}
              onClick={() => setActiveFilter('healthy')}
            />
            <StatCard
              label="Issues"
              value={issuesCount}
              tone="issues"
              active={activeFilter === 'issues'}
              onClick={() => setActiveFilter('issues')}
            />
          </div>
        )}

        {error && (
          <div style={styles.errorAlert}>
            <div style={styles.errorTitle}>Error loading plants</div>
            <div style={styles.errorMessage}>{error}</div>
          </div>
        )}

        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Loading your plant collection...</p>
          </div>
        )}

        {!loading && !error && plants.length === 0 && (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No plants registered yet</h3>
            <p style={styles.emptyText}>
              Start by adding your first aloe vera plant to begin monitoring its health.
            </p>
          </div>
        )}

        {!loading && !error && plants.length > 0 && filteredScans.length === 0 && (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No scans in this filter</h3>
            <p style={styles.emptyText}>
              Try selecting a different filter to view your scans.
            </p>
          </div>
        )}

        {!loading && !error && filteredScans.length > 0 && (
          <div style={styles.plantGrid}>
            {filteredScans.map((scan) => {
              const plant = getPlantForScan(scan)
              const isExpanded = showModal && expandedScanId === scan._id
              const latestScan = scan
              const hasScans = true
              const cardScanCount = 1
              const isDiseased = toBoolean(scan?.analysis_result?.disease_detected)
              const displayPlantId = plant?.plant_id || scan?.plant_id?.plant_id || 'N/A'
              const displaySpecies = plant?.species || 'Aloe barbadensis'
              const displayLocation =
                plant?.location?.farm_name ||
                plant?.location?.plot_number ||
                scan?.plant_id?.location?.farm_name ||
                scan?.plant_id?.location?.plot_number ||
                'Home'
              const displayAdded = plant?.createdAt || plant?.created_at || scan?.createdAt

              return (
                <article
                  key={scan._id}
                  style={styles.plantCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(160deg, #f0faef 0%, #e4f3e5 100%)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(160deg, #f4fbf5 0%, #edf7ef 100%)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.mainPanel}>
                      <div style={styles.mainPanelInner}>
                        <div style={styles.previewWrap}>
                          {latestScan?.image_data?.thumbnail_url ? (
                            <img
                              src={latestScan.image_data.thumbnail_url}
                              alt="plant scan"
                              style={styles.previewImage}
                            />
                          ) : (
                            <div style={styles.plantImagePlaceholder}>
                              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                <path d="M8 12a15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4 10" />
                                <path d="M8 12a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0 4-10" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div style={styles.cardSummary}>
                          <div style={styles.cardSummaryTop}>
                            <div>
                              <h3 style={styles.plantName}>{displayPlantId}</h3>
                              <p style={styles.plantLead}>Lush aloe profile with monitored growth metrics.</p>
                            </div>
                            <span
                              style={{
                                ...styles.badge,
                                ...(hasScans ? (isDiseased ? styles.badgeBad : styles.badgeGood) : styles.badgeNeutral)
                              }}
                            >
                              {hasScans ? (isDiseased ? 'Diseased' : 'Healthy') : 'No scan yet'}
                            </span>
                          </div>

                          <div style={styles.infoGrid}>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Species</span>
                              <span style={styles.infoValue}>{displaySpecies}</span>
                            </div>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Location</span>
                              <span style={styles.infoValue}>{displayLocation}</span>
                            </div>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Added</span>
                              <span style={styles.infoValue}>
                                {displayAdded
                                  ? new Date(displayAdded).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                  : 'Recently'}
                              </span>
                            </div>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Last Scan Result</span>
                              <span style={styles.infoValue}>{getScanDiseaseName(latestScan)}</span>
                            </div>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Confidence</span>
                              <span style={styles.infoValue}>
                                {(latestScan?.analysis_result?.confidence ?? latestScan?.analysis_result?.confidence_score) !== undefined
                                  ? `${(Number(latestScan.analysis_result.confidence ?? latestScan.analysis_result.confidence_score) * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside style={styles.sidePanel}>
                      <div style={styles.insightCard}>
                        <div style={styles.insightTitle}>Growth Analysis</div>
                        <div style={styles.insightValue}>
                          {cardScanCount} scan
                        </div>
                        <div style={styles.insightMeta}>Latest scan only</div>
                      </div>

                      <div style={styles.detailsCard}>
                        <div style={styles.detailsCardTitle}>Plant Details</div>
                        <div style={styles.quickGrid}>
                          <div style={styles.quickBox}>
                            <div style={styles.quickLabel}>Condition</div>
                            <div style={styles.quickValue}>
                              {hasScans ? (isDiseased ? 'Attention' : 'Stable') : 'No scan yet'}
                            </div>
                          </div>
                          <div style={styles.quickBox}>
                            <div style={styles.quickLabel}>Health</div>
                            <div style={styles.quickValue}>
                              {hasScans
                                ? (latestScan?.analysis_result?.health_score ?? latestScan?.analysis_result?.plant_health_score ?? 'N/A')
                                : 'N/A'}
                            </div>
                          </div>
                          <div style={styles.quickBox}>
                            <div style={styles.quickLabel}>Soil</div>
                              <div style={styles.quickValue}>{plant?.metadata?.soil_type || 'Balanced'}</div>
                          </div>
                          <div style={styles.quickBox}>
                            <div style={styles.quickLabel}>Maturity</div>
                              <div style={styles.quickValue}>{plant?.current_status?.harvest_ready ? 'Ready' : 'Growing'}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={styles.expandActionBtn}
                        disabled={!plant}
                        onClick={() => plant && togglePlantDetails(plant, scan._id)}
                        aria-label={isExpanded ? 'Hide plant details' : 'Show plant details'}
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </aside>
                  </div>

                  {isExpanded && (
                    <div style={styles.dropdownDetails}>
                      {actionError && <div style={styles.inlineActionError}>{actionError}</div>}
                      {actionSuccess && <div style={styles.inlineActionSuccess}>{actionSuccess}</div>}

                      <Section title="Basic Information">
                        <DetailGridItem label="Display ID" value={displayPlantId} />
                        <DetailGridItem label="Species" value={displaySpecies} />
                        <DetailGridItem label="Scan ID" value={scan.scan_id || scan._id} />
                        <DetailGridItem
                          label="Scan Date"
                          value={scan.createdAt ? new Date(scan.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        />
                      </Section>

                      {displayLocation && (
                        <Section title="Location">
                          <DetailGridItem label="Location" value={displayLocation} />
                        </Section>
                      )}

                      <Section title="Scan Health">
                        {(() => {
                          const scanAnalysis = latestScan?.analysis_result || {}
                          const ageMonths = Number(scanAnalysis.estimated_age_months)
                          const isAgeReady = Number.isFinite(ageMonths) && ageMonths >= 8
                          const isDiseaseDetected = toBoolean(scanAnalysis.disease_detected)
                          const isHarvestReady = Boolean(scanAnalysis.harvest_ready) || (!isDiseaseDetected && isAgeReady)
                          return (
                            <>
                        <DetailGridItem
                          label="Health Score"
                          value={`${Math.round(scanAnalysis.health_score ?? scanAnalysis.plant_health_score ?? 0)}/100`}
                        />
                        <DetailGridItem
                          label="Primary Condition"
                          value={getScanDiseaseName(latestScan)}
                        />
                        <DetailGridItem
                          label="Disease Severity"
                          value={scanAnalysis.disease_severity || 'None'}
                        />
                        <DetailGridItem
                          label="Harvest Ready"
                          value={isHarvestReady ? 'Yes' : 'No'}
                        />
                        {scanAnalysis.estimated_age_formatted && (
                          <DetailGridItem label="Estimated Age" value={scanAnalysis.estimated_age_formatted} />
                        )}
                            </>
                          )
                        })()}
                      </Section>

                      {(() => {
                        const scanAnalysis = latestScan?.analysis_result
                        if (!scanAnalysis || !plant) return null

                        const isDiseaseDetected = toBoolean(scanAnalysis.disease_detected)
                        const severityValue = String(scanAnalysis.disease_severity || '').toLowerCase()
                        const isSevereDisease = isDiseaseDetected && ['high', 'severe'].includes(severityValue)
                        const daysToHarvest = scanAnalysis.estimated_days_to_harvest
                        const maturity = String(scanAnalysis.maturity_assessment || '').toLowerCase()
                        const ageMonths = Number(scanAnalysis.estimated_age_months)
                        const isAgeReady = Number.isFinite(ageMonths) && ageMonths >= 8
                        const isReadyToHarvest = Boolean(
                          scanAnalysis.harvest_ready ||
                          (!isDiseaseDetected && (isAgeReady || (typeof daysToHarvest === 'number' && daysToHarvest <= 3) || maturity === 'optimal'))
                        )
                        const isChecklistForPlant = treatmentPlan?.plantId === plant._id
                        const checklistDoneCount = isChecklistForPlant
                          ? treatmentPlan.steps.filter((_, idx) => Boolean(treatmentPlan.checked?.[idx])).length
                          : 0
                        const isChecklistComplete = isChecklistForPlant && treatmentPlan.steps.length > 0 && checklistDoneCount === treatmentPlan.steps.length

                        if (!isDiseaseDetected && !isReadyToHarvest) return null

                        return (
                          <Section title="Action Center">
                            {isDiseaseDetected && (
                              <div style={styles.actionBlock}>
                                <p style={styles.actionLabel}>Disease Detected</p>
                                <p style={styles.actionText}>Isolate immediately, start treatment, and rescan in 3-7 days before harvest.</p>
                                <div style={styles.actionButtons}>
                                  <button
                                    type="button"
                                    style={styles.actionBtnWarn}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'isolate', 'Plant isolated from healthy batch.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Isolate Plant'}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.actionBtnPrimary}
                                    disabled={actionLoading || treatmentLoading}
                                    onClick={() => startTreatmentFlow(plant._id, latestScan, scanAnalysis)}
                                  >
                                    {actionLoading || treatmentLoading ? 'Loading...' : 'Start Treatment'}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.actionBtnNeutral}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'rescan_3_days', 'Rescan scheduled after 3 days.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Rescan in 3 Days'}
                                  </button>
                                </div>
                                {treatmentError && <p style={styles.treatmentErrorText}>{treatmentError}</p>}
                                {isChecklistForPlant && (
                                  <div style={styles.treatmentChecklistCard}>
                                    <p style={styles.treatmentChecklistTitle}>
                                      Treatment Checklist: {treatmentPlan.diseaseLabel}
                                    </p>
                                    <p style={styles.treatmentChecklistMeta}>
                                      Completed {checklistDoneCount}/{treatmentPlan.steps.length}
                                    </p>
                                    <div style={styles.treatmentChecklistList}>
                                      {treatmentPlan.steps.map((step, idx) => (
                                        <label key={`${idx}-${step}`} style={styles.treatmentChecklistItem}>
                                          <input
                                            type="checkbox"
                                            checked={Boolean(treatmentPlan.checked?.[idx])}
                                            onChange={() => toggleTreatmentStep(idx)}
                                            style={styles.treatmentCheckbox}
                                          />
                                          <span style={styles.treatmentChecklistText}>{step}</span>
                                        </label>
                                      ))}
                                    </div>
                                    {isChecklistComplete && (
                                      <div style={styles.actionButtons}>
                                        <button
                                          type="button"
                                          style={styles.actionBtnNeutral}
                                          disabled={actionLoading}
                                          onClick={() => applyPlantAction(plant._id, latestScan, 'rescan_3_days', 'Treatment done. Rescan scheduled after 3 days.')}
                                        >
                                          {actionLoading ? 'Saving...' : 'Schedule Rescan (3 Days)'}
                                        </button>
                                        <button
                                          type="button"
                                          style={styles.actionBtnPrimary}
                                          onClick={() => navigate('/scans')}
                                        >
                                          Scan Again Now
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {isSevereDisease && (
                              <div style={styles.actionBlock}>
                                <p style={styles.actionLabel}>Severe Disease Protocol</p>
                                <p style={styles.actionText}>Remove infected leaves, disinfect tools/area, and spot-check nearby plants.</p>
                                <div style={styles.actionButtons}>
                                  <button
                                    type="button"
                                    style={styles.actionBtnWarn}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'remove_infected_leaves', 'Removed infected leaves as containment.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Remove Infected Leaves'}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.actionBtnNeutral}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'disinfect_area', 'Tools and area disinfected.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Disinfect Area'}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.actionBtnNeutral}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'spot_check_nearby', 'Spot-check scan requested for nearby plants.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Spot Check Nearby'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {isReadyToHarvest && (
                              <div style={styles.actionBlock}>
                                <p style={styles.actionLabel}>Ready to Harvest</p>
                                <p style={styles.actionText}>Harvest within 0-3 days and log yield before/after harvest batch.</p>
                                <div style={styles.actionButtons}>
                                  <button
                                    type="button"
                                    style={styles.actionBtnPrimary}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'mark_for_harvest', 'Marked for harvest queue.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Mark for Harvest'}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.actionBtnPrimary}
                                    disabled={actionLoading}
                                    onClick={() => applyPlantAction(plant._id, latestScan, 'harvest_completed', 'Harvest completed.')}
                                  >
                                    {actionLoading ? 'Saving...' : 'Harvest Completed'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </Section>
                        )
                      })()}



                      {selectedPlant?.metadata && (
                        <Section title="Metadata">
                          {selectedPlant.metadata.variety && <DetailGridItem label="Variety" value={selectedPlant.metadata.variety} />}
                          {selectedPlant.metadata.propagation_method && <DetailGridItem label="Propagation Method" value={selectedPlant.metadata.propagation_method} />}
                          {selectedPlant.metadata.soil_type && <DetailGridItem label="Soil Type" value={selectedPlant.metadata.soil_type} />}
                        </Section>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function StatCard({ label, value, tone, active, onClick }) {
  const tones = {
    all: {
      bg: 'linear-gradient(135deg, #ddf1e2 0%, #cce6d3 100%)',
      hover: 'linear-gradient(135deg, #d5eddc 0%, #bedfc7 100%)',
      border: '#b7d8c0',
      image: '/images/aloe1.jpg',
      subtitle: 'Registered aloe entries'
    },
    healthy: {
      bg: 'linear-gradient(135deg, #d3f0de 0%, #bfe5cc 100%)',
      hover: 'linear-gradient(135deg, #c6ead5 0%, #addbbe 100%)',
      border: '#a8d4b6',
      image: '/images/aloe2.jpg',
      subtitle: 'Stable health profile'
    },
    issues: {
      bg: 'linear-gradient(135deg, #e4f1dc 0%, #d1e7c8 100%)',
      hover: 'linear-gradient(135deg, #daecd1 0%, #c0deba 100%)',
      border: '#b4d3ac',
      image: '/images/aloe-disease-detection.jpg',
      subtitle: 'Need attention'
    }
  }
  const selectedTone = tones[tone] || tones.all

  return (
    <button
      type="button"
      style={{
        ...styles.statCard,
        background: selectedTone.bg,
        borderColor: selectedTone.border,
        boxShadow: active ? 'inset 0 0 0 2px #6dbf5c, 0 10px 18px rgba(17, 43, 28, 0.12)' : '0 6px 14px rgba(17, 43, 28, 0.08)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = selectedTone.hover
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = selectedTone.bg
      }}
      aria-pressed={active}
    >
      <div style={styles.statCardHead}>
        <div>
          <div style={styles.statValue}>{value}</div>
          <div style={styles.statLabel}>{label}</div>
          <div style={styles.statSubLabel}>{selectedTone.subtitle}</div>
        </div>
        <div style={styles.statThumbWrap}>
          <img src={selectedTone.image} alt={label} style={styles.statThumb} />
        </div>
      </div>
    </button>
  )
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      <div style={styles.detailsGrid}>{children}</div>
    </section>
  )
}

function DetailGridItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 76px)',
    background: 'linear-gradient(180deg, #e6f2e7 0%, #eef7ef 56%, #e2f0e5 100%)',
    padding: '20px 16px 28px',
  },
  shell: {
    maxWidth: '1420px',
    margin: '0 auto',
    background: 'linear-gradient(180deg, #f2faf3 0%, #e8f3ea 100%)',
    border: '1px solid #cde2d2',
    borderRadius: '16px',
    boxShadow: '0 16px 28px rgba(17, 43, 28, 0.09)',
    padding: '18px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(173, 206, 186, 0.45)',
    background: 'linear-gradient(140deg, #1a4c35 0%, #2f7250 55%, #3a8a60 100%)',
    boxShadow: '0 10px 22px rgba(17, 43, 28, 0.16)',
  },
  headerIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.16)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
  },
  title: {
    margin: '0 0 3px 0',
    fontSize: '30px',
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#eef8f1',
  },
  subtitle: {
    margin: 0,
    color: '#cde3d3',
    fontSize: '13px',
    fontWeight: 600,
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '14px',
  },
  statCard: {
    borderRadius: '12px',
    border: '1px solid #b7d8c0',
    background: 'linear-gradient(135deg, #e8f4ea 0%, #dceddf 100%)',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  statCardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  statValue: {
    fontSize: '25px',
    fontWeight: 700,
    color: '#1f4a34',
    lineHeight: 1.1,
  },
  statLabel: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#62806c',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  statSubLabel: {
    marginTop: '2px',
    fontSize: '11px',
    color: '#557261',
    fontWeight: 600,
  },
  statThumbWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(108, 150, 121, 0.35)',
    boxShadow: '0 6px 12px rgba(17, 43, 28, 0.12)',
    flexShrink: 0,
    background: '#eaf4ec',
  },
  statThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  errorAlert: {
    border: '1px solid #f1cfcf',
    background: '#fff5f5',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '12px',
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '2px',
  },
  errorMessage: {
    color: '#7f1d1d',
    fontSize: '13px',
  },
  loadingState: {
    borderRadius: '12px',
    border: '1px solid #dceadf',
    background: '#f9fcf8',
    padding: '44px 18px',
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #dfece2',
    borderTop: '3px solid #7ecb69',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '10px',
    color: '#5f7f69',
    fontWeight: 600,
    fontSize: '14px',
  },
  emptyState: {
    borderRadius: '12px',
    border: '1px solid #dceadf',
    background: '#f9fcf8',
    padding: '44px 18px',
    textAlign: 'center',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    color: '#2f4f3d',
    fontSize: '20px',
    fontWeight: 700,
  },
  emptyText: {
    margin: 0,
    color: '#5f7f69',
    fontSize: '14px',
  },
  plantGrid: {
    display: 'grid',
    gap: '14px',
  },
  plantCard: {
    borderRadius: '14px',
    border: '1px solid #c3ddca',
    background: 'linear-gradient(160deg, #f4fbf5 0%, #edf7ef 100%)',
    overflow: 'hidden',
    boxShadow: 'none',
    transition: 'all 0.2s ease',
  },
  cardTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '14px',
    padding: '14px',
    alignItems: 'stretch',
  },
  mainPanel: {
    border: '1px solid #b9d8c0',
    borderRadius: '14px',
    background: 'linear-gradient(145deg, #e4f2e7 0%, #d3e8d9 100%)',
    padding: '12px',
  },
  mainPanelInner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
    alignItems: 'stretch',
  },
  previewWrap: {
    height: '220px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #a9cdb3',
    background: 'linear-gradient(145deg, #cfe8d6 0%, #b9dbc3 100%)',
    display: 'grid',
    placeItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    background: '#edf7ef',
  },
  plantImagePlaceholder: {
    color: '#4f9a43',
  },
  cardSummary: {
    minWidth: 0,
    marginTop: '10px',
    border: '1px solid #b8d6bf',
    borderRadius: '12px',
    background: 'linear-gradient(160deg, #e3f1e6 0%, #d2e8d8 100%)',
    padding: '10px',
  },
  cardSummaryTop: {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '10px',
  },
  plantName: {
    margin: 0,
    fontSize: '24px',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: '#1f3e2f',
    fontWeight: 700,
  },
  plantLead: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#5b7865',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  infoItem: {
    border: '1px solid #a8cdb3',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, #d8ecde 0%, #c6e2cf 100%)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#62806c',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  infoValue: {
    fontSize: '14px',
    color: '#2f4f3d',
    fontWeight: 600,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 700,
  },
  badgeGood: {
    background: '#d9f3cc',
    color: '#2f6b2f',
    border: '1px solid #bfe4af',
  },
  badgeBad: {
    background: '#fde2e2',
    color: '#9f1239',
    border: '1px solid #f9c0c0',
  },
  badgeNeutral: {
    background: '#e5ecf0',
    color: '#415866',
    border: '1px solid #c9d6de',
  },
  dropdownDetails: {
    borderTop: '1px solid #dceadf',
    padding: '14px',
    background: 'linear-gradient(180deg, #e7f3e9 0%, #dbecde 100%)',
  },
  section: {
    marginBottom: '12px',
    border: '1px solid #c5dccb',
    borderRadius: '12px',
    background: 'linear-gradient(165deg, #f2f9f3 0%, #e3f0e6 100%)',
    padding: '12px',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#62806c',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '10px',
  },
  detailItem: {
    border: '1px solid #cbe2d1',
    borderRadius: '8px',
    background: 'linear-gradient(180deg, #e8f4ea 0%, #dceddf 100%)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#5f7f69',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  detailValue: {
    fontSize: '14px',
    color: '#2f4f3d',
    fontWeight: 600,
  },
  scanHistoryList: {
    display: 'grid',
    gap: '8px',
  },
  scanRow: {
    border: '1px solid #cbe2d1',
    background: 'linear-gradient(180deg, #e8f4ea 0%, #dceee0 100%)',
    borderRadius: '8px',
    padding: '9px 10px',
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    gap: '10px',
    alignItems: 'center',
  },
  scanDisease: {
    fontSize: '12px',
    color: '#2f4f3d',
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  scanDate: {
    fontSize: '13px',
    color: '#2f4f3d',
    fontWeight: 700,
  },
  scanTime: {
    fontSize: '11px',
    color: '#6a8573',
    fontWeight: 600,
  },
  scanScore: {
    fontSize: '13px',
    color: '#2f4f3d',
    fontWeight: 700,
    background: '#def1d4',
    border: '1px solid #bfe2b1',
    borderRadius: '999px',
    padding: '5px 9px',
  },
  sidePanel: {
    border: '1px solid #bdd8c5',
    borderRadius: '14px',
    background: 'linear-gradient(150deg, #deefe2 0%, #d1e7d7 100%)',
    padding: '12px',
    display: 'grid',
    gap: '10px',
    alignContent: 'start',
  },
  insightCard: {
    border: '1px solid #a7ccb1',
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #cbe8d1 0%, #b8ddc1 100%)',
    padding: '12px',
  },
  insightTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2a4d39',
    letterSpacing: '0.02em',
  },
  insightValue: {
    marginTop: '6px',
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f3e2f',
    lineHeight: 1.1,
  },
  insightMeta: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#4f725d',
    fontWeight: 600,
  },
  detailsCard: {
    border: '1px solid #b7d4be',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, #eaf5ec 0%, #dceee0 100%)',
    padding: '10px',
  },
  detailsCardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2a4d39',
    marginBottom: '8px',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  quickBox: {
    border: '1px solid #bcd5c3',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, #e3f2e6 0%, #cfe8d5 100%)',
    padding: '8px',
  },
  quickLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#5f7f69',
    fontWeight: 700,
  },
  quickValue: {
    marginTop: '2px',
    fontSize: '12px',
    color: '#2f4f3d',
    fontWeight: 700,
  },
  expandActionBtn: {
    border: '1px solid #9bd187',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #b8eb9f 0%, #a3e185 100%)',
    color: '#1f4d2a',
    fontWeight: 700,
    fontSize: '13px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  inlineActionError: {
    border: '1px solid #f3c6c6',
    borderRadius: '10px',
    background: '#fff1f1',
    color: '#a51414',
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '10px',
  },
  inlineActionSuccess: {
    border: '1px solid #bfe4c5',
    borderRadius: '10px',
    background: '#effcf1',
    color: '#1f6c2e',
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '10px',
  },
  actionBlock: {
    border: '1px solid #c6ddcc',
    borderRadius: '10px',
    background: 'linear-gradient(160deg, #f1f8f3 0%, #e5f0e8 100%)',
    padding: '10px',
    marginBottom: '10px',
  },
  actionLabel: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#2f4f3d',
  },
  actionText: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#4f725d',
    fontWeight: 600,
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionBtnPrimary: {
    border: '1px solid #2f9a49',
    borderRadius: '8px',
    padding: '8px 10px',
    background: '#2f9a49',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  actionBtnWarn: {
    border: '1px solid #c26b12',
    borderRadius: '8px',
    padding: '8px 10px',
    background: '#c26b12',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  actionBtnNeutral: {
    border: '1px solid #b7d4be',
    borderRadius: '8px',
    padding: '8px 10px',
    background: 'linear-gradient(180deg, #eaf5ec 0%, #dceee0 100%)',
    color: '#2f4f3d',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  treatmentErrorText: {
    margin: '8px 0 0 0',
    color: '#8a2222',
    fontSize: '12px',
    fontWeight: 700,
  },
  treatmentChecklistCard: {
    marginTop: '10px',
    border: '1px solid #b7d4be',
    borderRadius: '10px',
    padding: '12px',
    background: 'linear-gradient(180deg, #eef8f0 0%, #e4f2e8 100%)',
  },
  treatmentChecklistTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#1f4d2a',
    fontWeight: 700,
  },
  treatmentChecklistMeta: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#41614d',
    fontWeight: 600,
  },
  treatmentChecklistList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '10px',
    maxWidth: '760px',
  },
  treatmentChecklistItem: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    alignItems: 'start',
    columnGap: '10px',
    margin: 0,
    width: '100%',
    fontSize: '12px',
    color: '#2f4f3d',
    fontWeight: 600,
  },
  treatmentCheckbox: {
    width: '16px',
    height: '16px',
    margin: '2px 0 0 0',
    padding: 0,
    display: 'block',
    accentColor: '#2f9a49',
    cursor: 'pointer',
  },
  treatmentChecklistText: {
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
}
