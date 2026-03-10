import React, { useEffect, useState } from 'react'
import api from '../services/api'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function Support() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    device_model: '',
    os_version: '',
    issue_category: 'technical',
    description: '',
    priority: 'medium'
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [myTickets, setMyTickets] = useState([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    const user = stored?.user || stored
    setForm((prev) => ({
      ...prev,
      full_name: user?.full_name || '',
      email: user?.email || ''
    }))
  }, [])

  const fetchMyTickets = async () => {
    try {
      const res = await api.get('/tickets/me')
      setMyTickets(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (_) {
      setMyTickets([])
    }
  }

  useEffect(() => {
    fetchMyTickets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.full_name.trim() || !form.email.trim() || !form.device_model.trim() || !form.os_version.trim() || !form.description.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (!imageFile) {
      setError('Please upload an issue image.')
      return
    }

    if (!imageFile.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image.')
      return
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      setError('Image is too large. Maximum size is 10MB.')
      return
    }

    try {
      setSubmitting(true)
      const payload = new FormData()
      payload.append('full_name', form.full_name.trim())
      payload.append('email', form.email.trim())
      payload.append('device_model', form.device_model.trim())
      payload.append('os_version', form.os_version.trim())
      payload.append('issue_category', form.issue_category)
      payload.append('priority', form.priority)
      payload.append('description', form.description.trim())
      payload.append('issue_image', imageFile)

      const res = await api.post('/tickets', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setMessage(`Ticket submitted successfully. Ticket No: ${res.data?.ticket_number || '-'}. Please wait for admin response.`)
      setForm((prev) => ({ ...prev, description: '' }))
      setImageFile(null)
      await fetchMyTickets()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={{ ...styles.card, ...styles.formCard }}>
          <div style={styles.cardHeader}>
            <p style={styles.eyebrow}>Support Center</p>
            <h1 style={styles.title}>Report an Issue</h1>
            <p style={styles.subtitle}>Submit a support ticket for technical concerns, account issues, or feature requests.</p>
          </div>

          {message && <div style={styles.success}>{message}</div>}
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input style={styles.input} placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input style={styles.input} placeholder="Device Model * (e.g. Samsung A54 / Lenovo ThinkPad E14)" value={form.device_model} onChange={(e) => setForm({ ...form, device_model: e.target.value })} />
              <input style={styles.input} placeholder="OS Version * (e.g. Android 14)" value={form.os_version} onChange={(e) => setForm({ ...form, os_version: e.target.value })} />

              <select style={styles.input} value={form.issue_category} onChange={(e) => setForm({ ...form, issue_category: e.target.value })}>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="billing">Billing</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug_report">Bug Report</option>
                <option value="other">Other</option>
              </select>

              <select style={styles.input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="Describe your issue in detail *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />

            <button style={styles.button} type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </section>

        <aside style={{ ...styles.card, ...styles.ticketCard }}>
          <div style={styles.cardHeaderCompact}>
            <h2 style={styles.sectionTitle}>My Tickets</h2>
            <span style={styles.ticketCount}>{myTickets.length}</span>
          </div>
          {myTickets.length === 0 && <p style={styles.empty}>No tickets submitted yet.</p>}
          {myTickets.map((t) => (
            <article key={t._id} style={styles.ticketRow}>
              <div style={styles.ticketTop}>
                <strong style={styles.ticketNumber}>{t.ticket_number}</strong>
                <span style={styles.statusBadge}>{String(t.status || '').replace('_', ' ')}</span>
              </div>
              <div style={styles.ticketSubject}>{t.subject || 'Support Request'}</div>
              <div style={styles.meta}>{new Date(t.createdAt).toLocaleString()}</div>
            </article>
          ))}
        </aside>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 76px)',
    background: 'linear-gradient(180deg, #edf5ef 0%, #f7fbf8 100%)',
    padding: '24px 16px'
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    alignItems: 'start'
  },
  card: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fcf9 100%)',
    border: '1px solid #d4e5d8',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 14px 28px rgba(15, 46, 30, 0.08)'
  },
  formCard: {
    minHeight: '100%'
  },
  ticketCard: {
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto'
  },
  cardHeader: {
    marginBottom: '16px'
  },
  cardHeaderCompact: {
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  eyebrow: {
    margin: '0 0 4px 0',
    color: '#2e6b49',
    textTransform: 'uppercase',
    letterSpacing: '0.11em',
    fontWeight: 800,
    fontSize: '11px'
  },
  title: {
    margin: 0,
    color: '#173927',
    fontSize: '32px',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    fontWeight: 800
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#547463',
    fontSize: '14px',
    fontWeight: 500
  },
  sectionTitle: {
    margin: 0,
    color: '#1f4430',
    fontSize: '22px',
    fontWeight: 800
  },
  ticketCount: {
    minWidth: '32px',
    height: '32px',
    borderRadius: '999px',
    background: '#e5f2e9',
    border: '1px solid #c8dfd0',
    color: '#2c6948',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '13px'
  },
  form: { display: 'grid', gap: '12px' },
  formGrid: {
    display: 'grid',
    gap: '10px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
  },
  input: {
    width: '100%',
    padding: '12px 13px',
    border: '1px solid #c7dbcb',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f3f2e',
    fontSize: '14px'
  },
  textarea: {
    minHeight: '130px',
    resize: 'vertical'
  },
  button: {
    border: '1px solid #1f7a46',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1f7a46 0%, #1a673c 100%)',
    color: '#ffffff',
    padding: '12px 14px',
    fontWeight: 800,
    fontSize: '14px',
    letterSpacing: '0.01em',
    cursor: 'pointer'
  },
  success: {
    marginBottom: '12px',
    padding: '11px 12px',
    borderRadius: '10px',
    background: '#edf9f1',
    border: '1px solid #badfc5',
    color: '#1f6b3e',
    fontSize: '14px'
  },
  error: {
    marginBottom: '12px',
    padding: '11px 12px',
    borderRadius: '10px',
    background: '#fff1f1',
    border: '1px solid #f2c5c5',
    color: '#9a2d2d',
    fontSize: '14px'
  },
  empty: { color: '#5f7869', marginTop: '8px', fontSize: '14px' },
  ticketRow: {
    marginTop: '10px',
    padding: '12px',
    border: '1px solid #d7e7db',
    borderRadius: '12px',
    background: '#fbfefc'
  },
  ticketTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  ticketNumber: {
    color: '#224a34',
    fontSize: '13px'
  },
  statusBadge: {
    borderRadius: '999px',
    background: '#e8f3eb',
    border: '1px solid #c8dfcf',
    color: '#2d6d49',
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'capitalize'
  },
  ticketSubject: {
    marginTop: '6px',
    color: '#2c4f3a',
    fontSize: '14px',
    fontWeight: 600
  },
  meta: {
    marginTop: '6px',
    color: '#607b6a',
    fontSize: '12px'
  }
}
