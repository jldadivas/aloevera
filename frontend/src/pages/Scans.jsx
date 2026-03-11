import React, { useEffect, useRef, useState } from 'react'
import api from '../services/api'

export default function Scans() {
  const [scans, setScans] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedScan, setSelectedScan] = useState(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [liveDetections, setLiveDetections] = useState([])
  const [videoDevices, setVideoDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [activeCameraLabel, setActiveCameraLabel] = useState('')

  const videoRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const previewUrlRef = useRef(null)
  const detectionLoopRef = useRef(null)
  const detectingRef = useRef(false)

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

      setScans(all)
      return all
    } catch (err) {
      console.log('Scans load error:', err)
      setError(err.message)
      return []
    }
  }

  useEffect(() => {
    setLoading(true)
    loadAllScans().finally(() => setLoading(false))
    loadVideoDevices()

    return () => {
      stopCamera()
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const loadVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter(d => d.kind === 'videoinput')
      const isVirtualCam = (label = '') => {
        const l = label.toLowerCase()
        return l.includes('virtual') || l.includes('obs') || l.includes('snap camera') || l.includes('manycam')
      }
      const sortedCams = [...cams].sort((a, b) => {
        const aVirtual = isVirtualCam(a.label)
        const bVirtual = isVirtualCam(b.label)
        if (aVirtual === bVirtual) return 0
        return aVirtual ? 1 : -1
      })
      setVideoDevices(sortedCams)
      if (!selectedDeviceId && sortedCams.length > 0) {
        setSelectedDeviceId(sortedCams[0].deviceId)
      }
    } catch (_) {
      // ignore device enumeration issues
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      setFile(selectedFile)
      const localUrl = URL.createObjectURL(selectedFile)
      previewUrlRef.current = localUrl
      setPreview(localUrl)
      setError(null)
    }
  }

  const resetSelectedFile = () => {
    setFile(null)
    setPreview(null)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const stopCamera = () => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current)
      detectionLoopRef.current = null
    }
    detectingRef.current = false
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCameraReady(false)
    setActiveCameraLabel('')
    setLiveDetections([])
    clearOverlayCanvas()
  }

  const waitForVideoFrame = (videoEl, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()
      const tick = () => {
        if (!videoEl) {
          reject(new Error('Video element not found'))
          return
        }
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          resolve(true)
          return
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error('No camera frames received'))
          return
        }
        requestAnimationFrame(tick)
      }
      tick()
    })
  }

  const waitForVideoElement = (timeoutMs = 2000) => {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()
      const tick = () => {
        if (videoRef.current) {
          resolve(videoRef.current)
          return
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error('Video element not mounted'))
          return
        }
        requestAnimationFrame(tick)
      }
      tick()
    })
  }

  const clearOverlayCanvas = () => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)
  }

  const drawLiveDetections = (detections = [], imageSize = null) => {
    const video = videoRef.current
    const overlay = overlayCanvasRef.current
    if (!video || !overlay) return

    const displayWidth = video.clientWidth || 0
    const displayHeight = video.clientHeight || 0
    if (!displayWidth || !displayHeight) return

    if (overlay.width !== displayWidth || overlay.height !== displayHeight) {
      overlay.width = displayWidth
      overlay.height = displayHeight
    }

    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (!Array.isArray(detections) || detections.length === 0) return

    const sourceWidth = imageSize?.width || video.videoWidth || displayWidth
    const sourceHeight = imageSize?.height || video.videoHeight || displayHeight
    if (!sourceWidth || !sourceHeight) return

    // Keep math aligned with CSS objectFit: 'contain'
    const scale = Math.min(displayWidth / sourceWidth, displayHeight / sourceHeight)
    const renderedWidth = sourceWidth * scale
    const renderedHeight = sourceHeight * scale
    const offsetX = (displayWidth - renderedWidth) / 2
    const offsetY = (displayHeight - renderedHeight) / 2

    detections.forEach((det) => {
      const bbox = det?.bbox
      if (!bbox) return

      const x = bbox.x1 * scale + offsetX
      const y = bbox.y1 * scale + offsetY
      const w = (bbox.x2 - bbox.x1) * scale
      const h = (bbox.y2 - bbox.y1) * scale

      if (w <= 1 || h <= 1) return

      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)

      const label = `${det.disease || 'disease'} ${(Number(det.confidence || 0) * 100).toFixed(1)}%`
      ctx.font = '12px Segoe UI'
      const textWidth = ctx.measureText(label).width
      const labelHeight = 20
      const labelX = Math.max(0, x)
      const labelY = Math.max(0, y - labelHeight - 2)

      ctx.fillStyle = 'rgba(34, 197, 94, 0.95)'
      ctx.fillRect(labelX, labelY, textWidth + 10, labelHeight)
      ctx.fillStyle = '#04210f'
      ctx.fillText(label, labelX + 5, labelY + 14)
    })
  }

  const runLiveDetection = async () => {
    if (detectingRef.current) return
    const video = videoRef.current
    if (!video || !cameraActive || !cameraReady) return
    if (!video.videoWidth || !video.videoHeight) return

    detectingRef.current = true
    try {
      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = video.videoWidth
      frameCanvas.height = video.videoHeight
      const frameCtx = frameCanvas.getContext('2d')
      if (!frameCtx) return
      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height)

      const frameBlob = await new Promise((resolve) => {
        frameCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82)
      })
      if (!frameBlob) return

      const form = new FormData()
      form.append('file', frameBlob, `live-frame-${Date.now()}.jpg`)

      const response = await api.post('/ml/detect-disease?live=true', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const data = response.data?.data || {}
      const detections = Array.isArray(data.detections) ? data.detections : []
      setLiveDetections(detections)
      drawLiveDetections(detections, data.image_size)
    } catch (err) {
      // Keep live preview running even if one inference call fails.
      console.warn('Live detection request failed:', err?.response?.data || err?.message)
    } finally {
      detectingRef.current = false
    }
  }

  useEffect(() => {
    if (!cameraActive || !cameraReady) {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current)
        detectionLoopRef.current = null
      }
      clearOverlayCanvas()
      return
    }

    runLiveDetection()
    detectionLoopRef.current = setInterval(runLiveDetection, 1200)

    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current)
        detectionLoopRef.current = null
      }
      detectingRef.current = false
    }
  }, [cameraActive, cameraReady])

  const startCamera = async () => {
    try {
      setCameraLoading(true)
      setCameraError(null)
      setError(null)
      setCameraReady(false)
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      // Mount the preview first so the video element ref is available.
      setCameraActive(true)
      const video = await waitForVideoElement()

      mediaStreamRef.current = stream
      const activeTrack = stream.getVideoTracks?.()[0]
      setActiveCameraLabel(activeTrack?.label || 'Camera')

      video.onloadedmetadata = () => {
        console.log('Video width:', video.videoWidth)
        console.log('Video height:', video.videoHeight)
        console.log('Ready state:', video.readyState)
      }
      video.srcObject = stream
      await video.play()
      await waitForVideoFrame(video, 6000)

      await loadVideoDevices()
      setCameraReady(true)
      setCameraError(null)
    } catch (err) {
      stopCamera()
      console.error('Camera error:', err)
      setCameraError('No camera frames received. Close Camera/Zoom apps using webcam, allow browser camera permission, then try again.')
    } finally {
      setCameraLoading(false)
    }
  }

  const captureFromCamera = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraActive) return
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet. Please wait a second and try again.')
      return
    }

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const capturedFile = new File([blob], `camera-scan-${Date.now()}.jpg`, { type: 'image/jpeg' })
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      const localUrl = URL.createObjectURL(capturedFile)
      previewUrlRef.current = localUrl
      setFile(capturedFile)
      setPreview(localUrl)
      setCameraError(null)
      setError(null)
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const onUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select an image to scan')
      return
    }
    
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('image', file)
    
    try {
      console.log('Uploading scan for user:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'unknown')
      console.log('File details:', { name: file.name, size: file.size, type: file.type })
      
      const response = await api.post('/scans', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      console.log('Scan upload response:', response.data)
      
      await loadAllScans()
      
      // Select the newly created scan
      if (response.data.data.scan) {
        setSelectedScan(response.data.data.scan)
      }

      resetSelectedFile()
    } catch (err) {
      console.error('Upload error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        error: err.response?.data,
        message: err.message
      })
      setError(err.response?.data?.error || err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundLayer} />
      <div style={styles.contentLayer}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>Aloe Vera Health Scanner</h1>
          <p style={styles.subtitle}>AI-powered disease detection & age estimation with YOLOv8</p>
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
          <span>{error}</span>
        </div>
      )}
      {/* Upload Card */}
      <div style={styles.uploadCard}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>New Scan</h2>
          <div style={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            <span>Aloe Vera</span>
          </div>
        </div>

        <form onSubmit={onUpload}>
          <div style={styles.cameraTopRow}>
            <div style={styles.cameraSelectWrap}>
              <label htmlFor="camera-device" style={styles.cameraSelectLabel}>Camera</label>
              <select
                id="camera-device"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={styles.cameraSelect}
                disabled={cameraLoading || uploading}
              >
                {videoDevices.length === 0 && <option value="">Default camera</option>}
                {videoDevices.map((d, idx) => (
                  <option key={d.deviceId || `cam-${idx}`} value={d.deviceId}>
                    {d.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={loadVideoDevices} style={styles.refreshDeviceButton}>
              Refresh Cameras
            </button>
          </div>

          {/* Camera Controls */}
          <div style={styles.cameraActions}>
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraLoading || uploading}
                style={styles.cameraButton}
              >
                {cameraLoading ? 'Opening camera...' : 'Use Live Camera'}
              </button>
            ) : (
              <div style={styles.cameraActionRow}>
                <button type="button" onClick={captureFromCamera} style={styles.cameraCaptureButton}>
                  Capture Photo
                </button>
                <button type="button" onClick={stopCamera} style={styles.cameraStopButton}>
                  Stop Camera
                </button>
              </div>
            )}
          </div>

          {cameraError && <p style={styles.cameraErrorText}>{cameraError}</p>}
          {activeCameraLabel && /virtual|obs|snap camera|manycam/i.test(activeCameraLabel) && (
            <p style={styles.cameraWarnText}>
              You are using a virtual camera ({activeCameraLabel}). Select your physical webcam in the Camera dropdown.
            </p>
          )}

          {(cameraLoading || cameraActive) && (
            <div style={styles.cameraPreviewWrap}>
              <video ref={videoRef} style={styles.cameraVideo} playsInline autoPlay />
              <canvas ref={overlayCanvasRef} style={styles.cameraOverlayCanvas} />
              {!cameraReady && (
                <div style={styles.cameraLoadingOverlay}>
                  Starting camera...
                </div>
              )}
              {cameraReady && (
                <div style={styles.cameraLiveBadge}>
                  Live: {activeCameraLabel || 'Camera'}
                </div>
              )}
              <p style={styles.cameraHint}>Point the camera at the aloe vera leaf, then click "Capture Photo".</p>
              {cameraReady && (
                <p style={styles.cameraDetectionHint}>
                  Live detections: {liveDetections.length}
                </p>
              )}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Upload Area */}
          <div style={styles.uploadArea}>
            {preview ? (
              <div style={styles.previewContainer}>
                <img src={preview} alt="preview" style={styles.previewImage} />
                <div style={styles.previewOverlay}>
                  <button
                    type="button"
                    onClick={resetSelectedFile}
                    style={styles.removeButton}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Remove
                  </button>
                </div>
                <p style={styles.fileName}>{file?.name}</p>
              </div>
            ) : (
              <label style={styles.uploadLabel} htmlFor="fileInput">
                <svg style={styles.uploadIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={styles.uploadText}>
                  <span style={styles.uploadTextBold}>Click to upload</span> or drag and drop
                </p>
                <p style={styles.uploadHint}>PNG, JPG, WEBP up to 10MB</p>
              </label>
            )}
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              disabled={uploading}
              style={styles.fileInput}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            style={{
              ...styles.submitButton,
              ...(uploading || !file ? styles.submitButtonDisabled : {})
            }}
          >
            {uploading ? (
              <>
                <svg style={styles.spinner} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Analyzing with AI...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Start Analysis
              </>
            )}
          </button>
        </form>
      </div>

      {/* Scan History Grid */}
      {scans.length > 0 && (
        <div style={styles.scanHistorySection}>
          <h2 style={styles.scanHistoryTitle}>Scan History</h2>
          <span style={styles.scanCount}>{scans.length} scans</span>
          <div style={styles.scanGrid}>
            {scans.map(scan => (
              <div
                key={scan._id}
                style={styles.scanGridCard}
                onClick={() => setSelectedScan(scan)}
              >
                {scan.image_data?.thumbnail_url && (
                  <img src={scan.image_data.thumbnail_url} alt="scan" style={styles.scanGridImage} />
                )}
                <div style={styles.scanGridInfo}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    <span style={{fontSize: '16px'}}>
                      {scan.analysis_result?.disease_detected ? '⚠️' : '✅'}
                    </span>
                    <span style={{fontSize: '12px', fontWeight: '600', color: scan.analysis_result?.disease_detected ? '#dc2626' : '#16a34a'}}>
                      {scan.analysis_result?.disease_detected ? 'Diseased' : 'Healthy'}
                    </span>
                  </div>
                  {scan.analysis_result?.disease_detected && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#dc2626',
                      marginBottom: '6px',
                      padding: '4px 6px',
                      backgroundColor: '#fee2e2',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      🦠 {scan.analysis_result?.disease_name || 'Disease'}
                    </div>
                  )}
                  <div style={{fontSize: '11px', color: '#c8ddd0', marginBottom: '4px'}}>
                    {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{fontSize: '13px', fontWeight: '600', color: '#eef8f1'}}>
                    Health Score: {Math.round(scan.analysis_result?.health_score ?? 0)}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    overflow: 'hidden',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: '24px 20px 30px',
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'rgba(9, 37, 24, 0.5)',
    border: '1px solid rgba(166, 205, 182, 0.4)',
    borderRadius: '18px',
    boxShadow: '0 16px 30px rgba(5, 20, 13, 0.3)',
    backdropFilter: 'blur(8px)',
  },
  backgroundLayer: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at 12% 12%, rgba(206, 231, 216, 0.2) 0%, transparent 34%), radial-gradient(circle at 88% 0%, rgba(101, 146, 120, 0.2) 0%, transparent 30%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },
  
  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  headerIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#eef8f1',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '15px',
    color: '#d4e8da',
    fontWeight: '400',
  },

  // Error Alert
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(95, 21, 21, 0.58)',
    border: '1px solid rgba(254, 202, 202, 0.5)',
    borderRadius: '12px',
    marginBottom: '24px',
    color: '#ffdede',
    fontSize: '14px',
  },
  errorIcon: {
    flexShrink: 0,
  },
  actionSuccessAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'rgba(13, 77, 42, 0.55)',
    border: '1px solid rgba(134, 239, 172, 0.45)',
    borderRadius: '12px',
    marginBottom: '24px',
    color: '#d8ffe5',
    fontSize: '14px',
  },

  // Upload Card
  uploadCard: {
    backgroundColor: 'rgba(10, 38, 25, 0.45)',
    border: '1px solid rgba(171, 210, 186, 0.46)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 12px 24px rgba(7, 23, 15, 0.26)',
    backdropFilter: 'blur(8px)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#eef8f1',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(188, 229, 202, 0.22)',
    color: '#d7efdf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },

  // Upload Area
  uploadArea: {
    position: 'relative',
    marginBottom: '20px',
  },
  cameraActions: {
    marginBottom: '14px',
  },
  cameraTopRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'end',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  cameraSelectWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '260px',
    flex: '1',
  },
  cameraSelectLabel: {
    fontSize: '12px',
    color: '#cde1d3',
    fontWeight: '600',
  },
  cameraSelect: {
    border: '1px solid rgba(173, 206, 186, 0.4)',
    borderRadius: '8px',
    padding: '9px 10px',
    fontSize: '13px',
    backgroundColor: 'rgba(191, 224, 202, 0.14)',
    color: '#eef8f2',
  },
  refreshDeviceButton: {
    padding: '9px 12px',
    backgroundColor: 'rgba(190, 222, 201, 0.2)',
    border: '1px solid rgba(173, 206, 186, 0.38)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#e3f3e8',
    cursor: 'pointer',
  },
  cameraActionRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cameraButton: {
    padding: '10px 14px',
    backgroundColor: '#0f766e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cameraCaptureButton: {
    padding: '10px 14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cameraStopButton: {
    padding: '10px 14px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cameraPreviewWrap: {
    marginBottom: '14px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
    backgroundColor: '#111827',
    position: 'relative',
  },
  cameraVideo: {
    width: '100%',
    maxHeight: '360px',
    display: 'block',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  cameraOverlayCanvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e5e7eb',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cameraLiveBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ecfeff',
    backgroundColor: 'rgba(15, 118, 110, 0.85)',
    borderRadius: '999px',
    padding: '5px 10px',
    border: '1px solid rgba(94, 234, 212, 0.45)',
  },
  cameraHint: {
    margin: 0,
    padding: '8px 12px',
    fontSize: '12px',
    color: '#e5e7eb',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cameraDetectionHint: {
    margin: 0,
    padding: '6px 12px 10px',
    fontSize: '12px',
    color: '#bdeecf',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cameraErrorText: {
    margin: '0 0 12px 0',
    color: '#dc2626',
    fontSize: '13px',
  },
  cameraWarnText: {
    margin: '0 0 12px 0',
    color: '#92400e',
    fontSize: '13px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    border: '2px dashed rgba(175, 210, 189, 0.45)',
    borderRadius: '12px',
    backgroundColor: 'rgba(196, 227, 206, 0.12)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  uploadIcon: {
    color: '#c5dccd',
    marginBottom: '12px',
  },
  uploadText: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: '#d3e7d9',
  },
  uploadTextBold: {
    color: '#22c55e',
    fontWeight: '600',
  },
  uploadHint: {
    margin: 0,
    fontSize: '12px',
    color: '#b7cfbf',
  },
  fileInput: {
    display: 'none',
  },

  // Preview
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    maxHeight: '320px',
    objectFit: 'contain',
    borderRadius: '12px',
    border: '2px solid rgba(172, 206, 185, 0.4)',
    backgroundColor: 'rgba(196, 227, 206, 0.12)',
  },
  previewOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  fileName: {
    margin: '12px 0 0 0',
    fontSize: '13px',
    color: '#cbdfd1',
    textAlign: 'center',
  },

  // Submit Button
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },

  // Detailed Results Section
  detailedResultsSection: {
    backgroundColor: 'rgba(10, 38, 25, 0.45)',
    border: '1px solid rgba(171, 210, 186, 0.46)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 12px 24px rgba(7, 23, 15, 0.26)',
    backdropFilter: 'blur(8px)',
  },
  detailedTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#eef8f1',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  resultCard: {
    border: '1px solid rgba(173, 206, 186, 0.38)',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: 'rgba(190, 222, 201, 0.16)',
  },
  cardTitleSmall: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#caded1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statusBadgeLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  diseaseNameLarge: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#dc2626',
  },
  severityText: {
    margin: 0,
    fontSize: '13px',
    color: '#c4dccd',
  },
  confidenceText: {
    margin: '8px 0 0 0',
    fontSize: '13px',
    color: '#c4dccd',
  },
  scoreContainer: {
    gap: '8px',
  },
  scoreBar: {
    height: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  scoreValue: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#ecf7f0',
  },
  ageValue: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#16a34a',
  },
  ageMonths: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#c4dccd',
  },
  maturityValue: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ecf7f0',
  },
  harvestText: {
    margin: '0',
    fontSize: '13px',
    color: '#c4dccd',
  },
  recommendationsBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '16px',
  },
  recommendationsTitle: {
    margin: '0 0 12px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#15803d',
  },
  recommendationsList: {
    margin: 0,
    paddingLeft: '20px',
    listStyle: 'none',
  },
  recommendationItem: {
    margin: '6px 0',
    fontSize: '14px',
    color: '#166534',
  },
  actionPanel: {
    marginTop: '16px',
    backgroundColor: 'rgba(190, 222, 201, 0.14)',
    border: '1px solid rgba(173, 206, 186, 0.38)',
    borderRadius: '12px',
    padding: '14px',
  },
  actionPanelTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#eaf6ee',
  },
  actionGroup: {
    borderTop: '1px solid rgba(173, 206, 186, 0.25)',
    paddingTop: '10px',
    marginTop: '10px',
  },
  actionGroupLabel: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#eaf6ee',
  },
  actionHint: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#c9e0d1',
    lineHeight: 1.45,
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  actionButtonPrimary: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #1f8f4f',
    backgroundColor: '#1f8f4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
  },
  actionButtonWarn: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #b45309',
    backgroundColor: '#b45309',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
  },
  actionButtonNeutral: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(173, 206, 186, 0.55)',
    backgroundColor: 'rgba(190, 222, 201, 0.16)',
    color: '#eaf6ee',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
  },

  // History Section
  historySection: {
    marginTop: '40px',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  historyTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  historyCount: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
  },

  // Loading State
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 24px',
    backgroundColor: 'rgba(19, 57, 37, 0.5)',
    border: '1px solid rgba(172, 210, 187, 0.35)',
    borderRadius: '16px',
    backdropFilter: 'blur(6px)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#d5e8dc',
    fontSize: '14px',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 24px',
    backgroundColor: 'rgba(19, 57, 37, 0.5)',
    border: '1px solid rgba(172, 210, 187, 0.35)',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(6px)',
  },
  emptyIcon: {
    color: '#d1d5db',
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

  // Scan Grid
  scanGridLegacy: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  scanCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  scanCardActive: {
    border: '2px solid #22c55e',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
  },
  scanImageContainer: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  scanImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scanContent: {
    padding: '20px',
  },

  // Status Badge
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '12px',
  },
  statusBadgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusBadgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },

  // Condition
  conditionTitle: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
  },

  // Age Badge
  ageBadgeText: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#6b7280',
  },

  // Metrics
  metricsRow: {
    marginBottom: '16px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  confidenceBar: {
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },

  // Timestamp
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#9ca3af',
  },

  // Timeline Styles
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    position: 'relative',
  },
  timelineItem: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '24px',
    paddingBottom: '48px',
    position: 'relative',
  },
  timelineDot: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    flexShrink: 0,
    marginTop: '8px',
  },
  timelineLine: {
    position: 'absolute',
    left: '23px',
    top: '56px',
    width: '2px',
    bottom: '-48px',
    backgroundColor: '#e5e7eb',
  },
  timelineCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  timelineCardActive: {
    border: '2px solid #22c55e',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
    backgroundColor: '#f0fdf4',
  },
  timelineCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '12px',
  },
  dateTimeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  timelineDate: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  timelineTime: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
  },
  statusBadgeTimeline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
  },
  timelineCardBody: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '20px',
    marginBottom: '16px',
  },
  timelineScanImage: {
    width: '140px',
    height: '140px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb',
  },
  timelineDiseaseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  diseaseBox: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    borderLeft: '4px solid #dc2626',
    borderRadius: '6px',
  },
  diseaseTitle: {
    margin: '0 0 6px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
  },
  severityBadge: {
    margin: 0,
    fontSize: '12px',
    color: '#7f1d1d',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  metricBox: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  metricBoxLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricBoxValue: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  scoreBarSmall: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  recommendationsPreview: {
    padding: '12px',
    backgroundColor: '#ecfdf5',
    borderLeft: '4px solid #10b981',
    borderRadius: '6px',
    marginTop: '8px',
  },
  recommendationsLabel: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#047857',
  },
  recommendationsPreviewList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#047857',
  },
  recommendationPreviewItem: {
    margin: '4px 0',
    fontSize: '12px',
  },
  timelineCardFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  viewDetailsButton: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Scan History Grid
  scanHistorySection: {
    marginBottom: '32px',
    paddingBottom: '32px',
    position: 'relative',
  },
  scanHistoryTitle: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#eef8f1',
    display: 'inline-block',
  },
  scanCount: {
    marginLeft: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#c5dccd',
  },
  scanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  scanGridCard: {
    backgroundColor: 'rgba(10, 38, 25, 0.45)',
    border: '1px solid rgba(171, 210, 186, 0.46)',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 18px rgba(7, 23, 15, 0.24)',
    backdropFilter: 'blur(8px)',
  },
  scanGridImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    display: 'block',
  },
  scanGridInfo: {
    padding: '12px',
    color: '#e8f5ec',
  },
}
