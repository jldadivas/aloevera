import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  FileSearch,
  Leaf,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Users,
  RefreshCw,
  Download,
  Flag,
  LogOut,
  Trash2,
  UserX,
  UserCheck,
  MessageSquareWarning
} from 'lucide-react';
import api from '../services/api';
import './Admin.css';

const tabs = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'scans', label: 'Scan Oversight', icon: FileSearch },
  { id: 'plants', label: 'Plant Oversight', icon: Leaf },
  { id: 'tickets', label: 'Support Ticketing', icon: MessageSquareWarning },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'community', label: 'Community Moderation', icon: ShieldCheck }
];

const formatPct = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-');
const DEACTIVATION_REASONS = [
  'Violation of community guidelines',
  'Suspicious or fraudulent activity',
  'Repeated policy non-compliance',
  'User requested account deactivation',
  'Inactive account cleanup',
  'Other'
];

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
};

const describeArc = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
};

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [plants, setPlants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [communityMetrics, setCommunityMetrics] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [reportStatus, setReportStatus] = useState('open');
  const [scanFilters, setScanFilters] = useState({ startDate: '', endDate: '', disease: 'all', minConfidence: '' });
  const [plantFilters, setPlantFilters] = useState({ userId: '', location: '', healthStatus: 'all', repeatedOnly: false });
  const [ticketFilters, setTicketFilters] = useState({ status: 'open', priority: 'all', assignee: 'all', search: '' });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationUser, setDeactivationUser] = useState(null);
  const [selectedDeactivationReason, setSelectedDeactivationReason] = useState(DEACTIVATION_REASONS[0]);
  const [customDeactivationReason, setCustomDeactivationReason] = useState('');

  const usersById = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user._id] = user;
    });
    return map;
  }, [users]);

  const setMessage = (okText = '', errText = '') => {
    setSuccess(okText);
    setError(errText);
    if (okText) setTimeout(() => setSuccess(''), 2600);
  };

  const fetchUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data?.data || []);
  };

  const fetchScans = async () => {
    const baseParams = {
      limit: 200,
      plantSpecies: 'aloe'
    };
    if (scanFilters.startDate) baseParams.startDate = scanFilters.startDate;
    if (scanFilters.endDate) baseParams.endDate = scanFilters.endDate;
    if (scanFilters.disease && scanFilters.disease !== 'all') baseParams.disease = scanFilters.disease;
    if (scanFilters.minConfidence !== '') baseParams.minConfidence = scanFilters.minConfidence;

    let page = 1;
    let pages = 1;
    const allRows = [];

    do {
      const res = await api.get('/admin/scans', { params: { ...baseParams, page } });
      const rows = res.data?.data || [];
      allRows.push(...rows);
      pages = Number(res.data?.pages || 1);
      page += 1;
    } while (page <= pages);

    setScans(allRows);
  };

  const fetchPlants = async () => {
    const baseParams = {
      limit: 200,
      plantSpecies: 'aloe'
    };
    if (plantFilters.userId) baseParams.userId = plantFilters.userId;
    if (plantFilters.location) baseParams.location = plantFilters.location;
    if (plantFilters.healthStatus && plantFilters.healthStatus !== 'all') baseParams.healthStatus = plantFilters.healthStatus;
    if (plantFilters.repeatedOnly) baseParams.repeatedOnly = 'true';

    let page = 1;
    let pages = 1;
    const allRows = [];

    do {
      const res = await api.get('/admin/plants', { params: { ...baseParams, page } });
      const rows = res.data?.data || [];
      allRows.push(...rows);
      pages = Number(res.data?.pages || 1);
      page += 1;
    } while (page <= pages);

    setPlants(allRows);
  };

  const fetchAnalytics = async () => {
    const res = await api.get('/admin/analytics', { params: { period: analyticsPeriod } });
    setAnalytics(res.data?.data || null);
  };

  const fetchTickets = async () => {
    const params = {
      limit: 200,
      status: ticketFilters.status,
      priority: ticketFilters.priority,
      assignee: ticketFilters.assignee
    };
    if (ticketFilters.search.trim()) params.search = ticketFilters.search.trim();
    const res = await api.get('/admin/tickets', { params });
    setTickets(res.data?.data || []);
  };

  const fetchCommunityModeration = async () => {
    const [postsRes, reportsRes, metricsRes] = await Promise.all([
      api.get('/admin/community/posts', { params: { limit: 30 } }),
      api.get('/admin/community/reports', { params: { status: reportStatus, limit: 40 } }),
      api.get('/admin/community/analytics', { params: { period: analyticsPeriod } })
    ]);
    setCommunityPosts(postsRes.data?.data || []);
    setCommunityReports(reportsRes.data?.data || []);
    setCommunityMetrics(metricsRes.data?.data || null);
  };

  const fetchTabData = async () => {
    try {
      setLoading(true);
      setError('');
      if (tab === 'users') await fetchUsers();
      if (tab === 'scans') await Promise.all([fetchUsers(), fetchScans()]);
      if (tab === 'plants') await Promise.all([fetchUsers(), fetchPlants()]);
      if (tab === 'tickets') await Promise.all([fetchUsers(), fetchTickets()]);
      if (tab === 'analytics') await fetchAnalytics();
      if (tab === 'community') await Promise.all([fetchUsers(), fetchCommunityModeration()]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    fetchTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, analyticsPeriod, reportStatus]);

  const handleUpdateUserField = async (userId, patch) => {
    try {
      await api.put(`/admin/users/${userId}`, patch);
      await fetchUsers();
      setMessage('User updated');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.is_active) {
      setDeactivationUser(user);
      setSelectedDeactivationReason(DEACTIVATION_REASONS[0]);
      setCustomDeactivationReason('');
      setShowDeactivateModal(true);
      return;
    }
    await handleUpdateUserField(user._id, { is_active: true });
  };

  const closeDeactivateModal = () => {
    setShowDeactivateModal(false);
    setDeactivationUser(null);
    setSelectedDeactivationReason(DEACTIVATION_REASONS[0]);
    setCustomDeactivationReason('');
  };

  const confirmDeactivateUser = async () => {
    if (!deactivationUser) return;

    const finalReason = selectedDeactivationReason === 'Other'
      ? customDeactivationReason.trim()
      : selectedDeactivationReason;

    if (!finalReason) {
      setMessage('', 'Please select or enter a deactivation reason.');
      return;
    }

    await handleUpdateUserField(deactivationUser._id, {
      is_active: false,
      deactivation_reason: finalReason
    });
    closeDeactivateModal();
  };

  const handleFlagScan = async (scanId, flagged) => {
    try {
      await api.put(`/admin/scans/${scanId}/flag`, { flagged });
      await fetchScans();
      setMessage(flagged ? 'Scan flagged for review' : 'Scan unflagged');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm('Delete this scan?')) return;
    try {
      await api.delete(`/admin/scans/${scanId}`);
      await fetchScans();
      setMessage('Scan deleted');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleModeratePost = async (postId, action) => {
    try {
      await api.put(`/admin/community/posts/${postId}/moderate`, { action });
      await fetchCommunityModeration();
      setMessage(`Post ${action} successful`);
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleModerateComment = async (postId, commentId, action) => {
    try {
      await api.put(`/admin/community/posts/${postId}/comments/${commentId}/moderate`, { action });
      await fetchCommunityModeration();
      setMessage(`Comment ${action} successful`);
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const notes = window.prompt(`Notes for ${action} (optional):`) || '';
      await api.put(`/admin/community/reports/${reportId}/resolve`, { action, notes });
      await fetchCommunityModeration();
      setMessage(`Report ${action} successful`);
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleMuteUser = async (userId) => {
    try {
      const minutesRaw = window.prompt('Mute duration in minutes (e.g. 60):', '60');
      if (!minutesRaw) return;
      const reason = window.prompt('Reason for mute:', 'Community policy violation') || 'Community policy violation';
      await api.put(`/admin/community/users/${userId}/mute`, { minutes: parseInt(minutesRaw, 10), reason });
      await fetchCommunityModeration();
      await fetchUsers();
      setMessage('User muted successfully');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const handleUpdateTicket = async (ticketId, patch) => {
    try {
      await api.put(`/admin/tickets/${ticketId}`, patch);
      await fetchTickets();
      setMessage('Ticket updated');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message);
    }
  };

  const exportCsv = (filename, rows) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadScanImagesZip = async () => {
    try {
      const params = {
        plantSpecies: 'aloe'
      };
      if (scanFilters.startDate) params.startDate = scanFilters.startDate;
      if (scanFilters.endDate) params.endDate = scanFilters.endDate;
      if (scanFilters.disease && scanFilters.disease !== 'all') params.disease = scanFilters.disease;
      if (scanFilters.minConfidence !== '') params.minConfidence = scanFilters.minConfidence;

      const res = await api.get('/admin/scans/images/zip', {
        params,
        responseType: 'blob'
      });

      const disposition = String(res.headers?.['content-disposition'] || '');
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `scanned_plant_images_${new Date().toISOString().slice(0, 10)}.zip`;

      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Scan images ZIP downloaded');
    } catch (err) {
      setMessage('', err.response?.data?.error || err.message || 'Failed to download scan images ZIP');
    }
  };

  const exportPdf = (title, sections) => {
    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const renderSection = (section) => {
      if (section.type === 'table') {
        const columns = section.columns || [];
        const rows = section.rows || [];
        const head = `<tr>${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}</tr>`;
        const body = rows.length
          ? rows
            .map((row) => `<tr>${columns.map((col) => `<td>${escapeHtml(row[col])}</td>`).join('')}</tr>`)
            .join('')
          : `<tr><td colspan="${Math.max(columns.length, 1)}">No data available</td></tr>`;
        return `<h2>${escapeHtml(section.title)}</h2><table>${head}${body}</table>`;
      }
      return `<h2>${escapeHtml(section.title)}</h2><pre>${escapeHtml(section.content || '')}</pre>`;
    };

    const html = `
      <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Segoe UI, sans-serif; padding: 24px; color: #111827; }
          h1 { margin-bottom: 12px; }
          h2 { margin-top: 18px; margin-bottom: 8px; font-size: 16px; }
          pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; white-space: pre-wrap; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${sections.map(renderSection).join('')}
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const analyticsMetrics = analytics?.metrics || {};
  const topDiseases = analytics?.top_diseases || [];
  const trends = analytics?.trends || [];
  const topDiseaseSeries = useMemo(() => {
    const series = topDiseases.slice(0, 6);
    const maxCount = Math.max(...series.map((d) => Number(d.count || 0)), 1);
    const maxBarHeightPx = 56;
    return series.map((d) => {
      const count = Number(d.count || 0);
      const barHeight = count > 0
        ? Math.max(8, Math.round((count / maxCount) * maxBarHeightPx))
        : 0;
      return {
        ...d,
        count,
        barHeight
      };
    });
  }, [topDiseases]);
  const pieSlices = useMemo(() => {
    const total = topDiseaseSeries.reduce((sum, d) => sum + Number(d.count || 0), 0);
    const colors = ['#3f6639', '#5f8743', '#7ea055', '#9eb96c', '#b8cc87', '#d3e2ab'];
    let currentAngle = 0;
    return topDiseaseSeries.map((d, index) => {
      const value = Number(d.count || 0);
      const angle = total > 0 ? (value / total) * 360 : 0;
      const slice = {
        ...d,
        color: colors[index % colors.length],
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
      };
      currentAngle += angle;
      return slice;
    });
  }, [topDiseaseSeries]);
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.length - activeUsers;
  const adminUsers = users.filter((u) => String(u.role).toLowerCase() === 'admin').length;
  const flaggedScans = scans.filter((s) => s.self_learning_status?.requires_validation).length;
  const clearScans = Math.max(scans.length - flaggedScans, 0);
  const avgConfidence = scans.length
    ? (
      scans.reduce((sum, item) => sum + Number(item.analysis_result?.confidence_score ?? item.analysis_result?.confidence ?? 0), 0) / scans.length
    ).toFixed(2)
    : '0.00';
  const diseasedPlants = plants.filter((p) => p.current_status?.disease_severity && p.current_status?.disease_severity !== 'none').length;
  const healthyPlants = Math.max(plants.length - diseasedPlants, 0);
  const repeatedPlants = plants.filter((p) => p.repeated_disease).length;
  const totalReports = communityReports.length;
  const openReports = communityReports.filter((r) => r.status === 'open').length;
  const hiddenPosts = communityPosts.filter((p) => p.is_hidden).length;
  const ticketOpen = tickets.filter((t) => t.status === 'open').length;
  const ticketInProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const ticketResolved = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
  const ticketUrgent = tickets.filter((t) => t.priority === 'urgent').length;
  const activeTabMeta = tabs.find((item) => item.id === tab) || tabs[0];

  const renderTabContent = () => {
    if (loading) return <div className="admin-panel-card">Loading data...</div>;

    if (tab === 'users') {
      return (
        <div className="admin-stack">
          <div className="admin-kpi-grid">
            <KpiCard icon={Users} label="Total Users" value={users.length} subtitle="Registered accounts" />
            <KpiCard icon={CheckCircle2} label="Active" value={activeUsers} subtitle="Currently enabled" tone="good" />
            <KpiCard icon={ShieldCheck} label="Admins" value={adminUsers} subtitle="Management users" />
            <KpiCard icon={AlertTriangle} label="Inactive" value={inactiveUsers} subtitle="Needs review" tone="warn" />
          </div>
          <div className="admin-panel-card">
            <div className="admin-section-title"><Users size={16} /><h3>User Management Table</h3></div>
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td><span className={`admin-pill ${String(u.role).toLowerCase() === 'admin' ? 'admin-pill-strong' : ''}`}>{u.role}</span></td>
                    <td>
                      <span className={`admin-status ${u.is_active ? 'admin-status-good' : 'admin-status-warn'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {!u.is_active && u.deactivation_reason ? ` (${u.deactivation_reason})` : ''}
                    </td>
                    <td className="admin-action-cell">
                      <button className="admin-btn admin-btn-soft" onClick={() => handleUpdateUserField(u._id, { role: u.role === 'admin' ? 'grower' : 'admin' })}>Toggle Role</button>
                      <button className="admin-btn admin-btn-soft" onClick={() => handleToggleUserStatus(u)}>
                        {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (tab === 'scans') {
      return (
        <div className="admin-stack">
          <div className="admin-kpi-grid">
            <KpiCard icon={FileSearch} label="Total Scans" value={scans.length} subtitle="Analyzed entries" />
            <KpiCard icon={Flag} label="Flagged" value={flaggedScans} subtitle="Needs validation" tone="warn" />
            <KpiCard icon={CheckCircle2} label="Clear" value={clearScans} subtitle="Quality approved" tone="good" />
            <KpiCard icon={Activity} label="Avg Confidence" value={avgConfidence} subtitle="Model confidence score" />
          </div>
          <div className="admin-panel-card">
            <div className="admin-section-title"><FileSearch size={16} /><h3>Scan Filters & Export</h3></div>
            <div className="admin-form-grid">
              <input type="date" value={scanFilters.startDate} onChange={(e) => setScanFilters({ ...scanFilters, startDate: e.target.value })} />
              <input type="date" value={scanFilters.endDate} onChange={(e) => setScanFilters({ ...scanFilters, endDate: e.target.value })} />
              <input placeholder="Disease (or all)" value={scanFilters.disease} onChange={(e) => setScanFilters({ ...scanFilters, disease: e.target.value })} />
              <input type="number" step="0.01" min="0" max="1" placeholder="Min confidence (0-1)" value={scanFilters.minConfidence} onChange={(e) => setScanFilters({ ...scanFilters, minConfidence: e.target.value })} />
              <button className="admin-btn" onClick={fetchScans}><RefreshCw size={14} />Apply Filters</button>
            </div>
            <div className="admin-inline-actions">
              <button
                className="admin-btn admin-btn-soft"
                onClick={() => exportCsv('admin_scans.csv', scans.map((s) => ({ scan_id: s.scan_id, user_email: s.user_id?.email || '', plant_id: s.plant_id?.plant_id || '', disease: s.analysis_result?.disease_name || 'healthy', confidence: s.analysis_result?.confidence_score ?? s.analysis_result?.confidence ?? '', created_at: s.createdAt })))}
              ><Download size={14} />Export CSV</button>
              <button className="admin-btn admin-btn-soft" onClick={handleDownloadScanImagesZip}><Download size={14} />Download Images ZIP</button>
              <button className="admin-btn admin-btn-soft" onClick={() => exportPdf('Admin Scan Oversight', [{ title: 'Scans', content: scans.map((s) => `${s.scan_id} | ${s.user_id?.email || '-'} | ${s.analysis_result?.disease_name || 'healthy'} | ${s.createdAt}`).join('\n') }])}><Download size={14} />Export PDF</button>
            </div>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-title"><ListChecks size={16} /><h3>Scan Oversight Table</h3></div>
            <table className="admin-table">
              <thead>
                <tr><th>Scan</th><th>User</th><th>Plant</th><th>Disease</th><th>Confidence</th><th>Flag</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s._id}>
                    <td>{s.scan_id}</td>
                    <td>{s.user_id?.email || '-'}</td>
                    <td>{s.plant_id?.plant_id || '-'}</td>
                    <td>{s.analysis_result?.disease_name || 'Healthy'}</td>
                    <td>{(s.analysis_result?.confidence_score ?? s.analysis_result?.confidence ?? 0).toString()}</td>
                    <td>
                      <span className={`admin-status ${s.self_learning_status?.requires_validation ? 'admin-status-warn' : 'admin-status-good'}`}>
                        {s.self_learning_status?.requires_validation ? 'Flagged' : 'Clear'}
                      </span>
                    </td>
                    <td className="admin-action-cell">
                      <button className="admin-btn admin-btn-soft" onClick={() => handleFlagScan(s._id, !s.self_learning_status?.requires_validation)}><Flag size={14} />{s.self_learning_status?.requires_validation ? 'Unflag' : 'Flag'}</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteScan(s._id)}><Trash2 size={14} />Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (tab === 'plants') {
      return (
        <div className="admin-stack">
          <div className="admin-kpi-grid">
            <KpiCard icon={Leaf} label="Tracked Plants" value={plants.length} subtitle="All monitored plants" />
            <KpiCard icon={Droplets} label="Healthy" value={healthyPlants} subtitle="Healthy condition" tone="good" />
            <KpiCard icon={AlertTriangle} label="Diseased" value={diseasedPlants} subtitle="Intervention needed" tone="warn" />
            <KpiCard icon={ShieldAlert} label="Repeated Cases" value={repeatedPlants} subtitle="Recurring incidents" />
          </div>
          <div className="admin-panel-card">
            <div className="admin-section-title"><Leaf size={16} /><h3>Plant Filters</h3></div>
            <div className="admin-form-grid">
              <select value={plantFilters.userId} onChange={(e) => setPlantFilters({ ...plantFilters, userId: e.target.value })}>
                <option value="">All Users</option>{users.map((u) => <option key={u._id} value={u._id}>{u.email}</option>)}
              </select>
              <input placeholder="Location (farm/plot)" value={plantFilters.location} onChange={(e) => setPlantFilters({ ...plantFilters, location: e.target.value })} />
              <select value={plantFilters.healthStatus} onChange={(e) => setPlantFilters({ ...plantFilters, healthStatus: e.target.value })}>
                <option value="all">All Health</option><option value="healthy">Healthy</option><option value="diseased">Diseased</option>
              </select>
              <label className="admin-checkbox"><input type="checkbox" checked={plantFilters.repeatedOnly} onChange={(e) => setPlantFilters({ ...plantFilters, repeatedOnly: e.target.checked })} />Repeated disease only</label>
              <button className="admin-btn" onClick={fetchPlants}><RefreshCw size={14} />Apply Filters</button>
            </div>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-title"><ListChecks size={16} /><h3>Plant Oversight Table</h3></div>
            <table className="admin-table">
              <thead>
                <tr><th>Plant ID</th><th>Owner</th><th>Location</th><th>Health</th><th>Disease Events</th><th>Repeated Event</th></tr>
              </thead>
              <tbody>
                {plants.map((p) => (
                  <tr key={p._id}>
                    <td>{p.plant_id}</td>
                    <td>{p.owner_id?.email || usersById[p.owner_id]?.email || '-'}</td>
                    <td>{p.location?.farm_name || p.location?.plot_number || 'Home'}</td>
                    <td>
                      <span className={`admin-status ${p.current_status?.disease_severity === 'none' ? 'admin-status-good' : 'admin-status-warn'}`}>
                        {p.current_status?.disease_severity === 'none' ? 'Healthy' : (p.current_status?.disease_severity || 'Unknown')}
                      </span>
                    </td>
                    <td>{p.disease_events ?? 0}</td>
                    <td>{p.repeated_disease ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (tab === 'tickets') {
      return (
        <div className="admin-stack">
          <div className="admin-kpi-grid">
            <KpiCard icon={MessageSquareWarning} label="Open Tickets" value={ticketOpen} subtitle="Awaiting admin action" tone="warn" />
            <KpiCard icon={Activity} label="In Progress" value={ticketInProgress} subtitle="Actively handled" />
            <KpiCard icon={CheckCircle2} label="Resolved/Closed" value={ticketResolved} subtitle="Completed concerns" tone="good" />
            <KpiCard icon={AlertTriangle} label="Urgent" value={ticketUrgent} subtitle="Needs priority handling" tone="warn" />
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-title"><ListChecks size={16} /><h3>Ticket Queue</h3></div>
            <div className="admin-form-grid">
              <select value={ticketFilters.status} onChange={(e) => setTicketFilters({ ...ticketFilters, status: e.target.value })}>
                <option value="all">All status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select value={ticketFilters.priority} onChange={(e) => setTicketFilters({ ...ticketFilters, priority: e.target.value })}>
                <option value="all">All priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select value={ticketFilters.assignee} onChange={(e) => setTicketFilters({ ...ticketFilters, assignee: e.target.value })}>
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.filter((u) => String(u.role).toLowerCase() === 'admin').map((u) => <option key={`assignee-${u._id}`} value={u._id}>{u.email}</option>)}
              </select>
              <input
                value={ticketFilters.search}
                onChange={(e) => setTicketFilters({ ...ticketFilters, search: e.target.value })}
                placeholder="Search ticket # or subject..."
              />
              <button className="admin-btn" onClick={fetchTickets}><RefreshCw size={14} />Apply Filters</button>
            </div>

            <table className="admin-table">
              <thead>
                <tr><th>Ticket</th><th>User</th><th>Category</th><th>Device</th><th>Image</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.ticket_number}</strong>
                      <div>{t.subject}</div>
                    </td>
                    <td>
                      <div>{t.reporter_name || t.user_id?.full_name || '-'}</div>
                      <small>{t.reporter_email || t.user_id?.email || '-'}</small>
                    </td>
                    <td>{(t.category || 'other').replace(/_/g, ' ')}</td>
                    <td>
                      <div>{t.device_model || t.mobile_unit || '-'}</div>
                      <small>{t.os_version || '-'}</small>
                    </td>
                    <td>
                      {t.issue_image?.url ? (
                        <button className="admin-btn admin-btn-soft" onClick={() => window.open(t.issue_image.url, '_blank')}>Preview</button>
                      ) : '-'}
                    </td>
                    <td>
                      <select value={t.priority} onChange={(e) => handleUpdateTicket(t._id, { priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </td>
                    <td>
                      <select value={t.status} onChange={(e) => handleUpdateTicket(t._id, { status: e.target.value })}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <select value={t.assigned_to?._id || ''} onChange={(e) => handleUpdateTicket(t._id, { assigned_to: e.target.value || null })}>
                        <option value="">Unassigned</option>
                        {users.filter((u) => String(u.role).toLowerCase() === 'admin').map((u) => <option key={`ticket-admin-${u._id}`} value={u._id}>{u.email}</option>)}
                      </select>
                    </td>
                    <td>{formatDateTime(t.createdAt)}</td>
                    <td className="admin-action-cell">
                      <button
                        className="admin-btn admin-btn-soft"
                        onClick={() => {
                          const details = [
                            `Ticket: ${t.ticket_number || '-'}`,
                            `Reporter: ${t.reporter_name || t.user_id?.full_name || '-'}`,
                            `Email: ${t.reporter_email || t.user_id?.email || '-'}`,
                            `Category: ${(t.category || 'other').replace(/_/g, ' ')}`,
                            `Priority: ${t.priority || '-'}`,
                            `Status: ${(t.status || '').replace(/_/g, ' ')}`,
                            `Device Model: ${t.device_model || t.mobile_unit || '-'}`,
                            `OS Version: ${t.os_version || '-'}`,
                            `Description: ${t.description || '-'}`
                          ].join('\n');
                          window.alert(details);
                        }}
                      >View</button>
                      <button className="admin-btn admin-btn-soft" disabled={t.status !== 'open'} onClick={() => handleUpdateTicket(t._id, { status: 'in_progress' })}>Start</button>
                      <button
                        className="admin-btn admin-btn-soft"
                        disabled={t.status !== 'in_progress'}
                        onClick={() => {
                          const note = window.prompt('Resolution notes (optional):', t.resolution_notes || '') || '';
                          handleUpdateTicket(t._id, { status: 'resolved', resolution_notes: note });
                        }}
                      >Resolve</button>
                      <button className="admin-btn admin-btn-soft" disabled={t.status !== 'resolved'} onClick={() => handleUpdateTicket(t._id, { status: 'closed' })}>Close</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (tab === 'analytics') {
      return (
        <div className="admin-stack">
          <div className="admin-kpi-grid">
            <KpiCard icon={BarChart3} label="Total Scans" value={analyticsMetrics.total_scans || 0} subtitle="In selected period" />
            <KpiCard icon={CheckCircle2} label="Healthy Rate" value={`${analyticsMetrics.healthy_rate || 0}%`} subtitle="Positive outcomes" tone="good" />
            <KpiCard icon={AlertTriangle} label="Disease Rate" value={`${analyticsMetrics.disease_rate || 0}%`} subtitle="Risk pressure" tone="warn" />
            <KpiCard icon={CircleDollarSign} label="Total Plants" value={analyticsMetrics.total_plants || 0} subtitle="Evaluated assets" />
          </div>
          <div className="admin-panel-card">
            <div className="admin-section-title"><BarChart3 size={16} /><h3>Report Controls</h3></div>
            <div className="admin-inline-actions">
              <select value={analyticsPeriod} onChange={(e) => setAnalyticsPeriod(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
              <button className="admin-btn admin-btn-soft" onClick={() => exportCsv('admin_analytics_trends.csv', trends.map((t) => ({ period: t.label, total_scans: t.total_scans, diseased_scans: t.diseased_scans, healthy_scans: t.healthy_scans, disease_rate: t.disease_rate })))}><Download size={14} />Export CSV</button>
              <button
                className="admin-btn admin-btn-soft"
                onClick={() => exportPdf('Admin Analytics Report', [
                  {
                    title: 'Report Summary',
                    content: `This report summarizes platform-wide plant health and scan performance for the selected ${analyticsPeriod} period. Use the metrics, top disease list, and trend table below to quickly identify risk patterns and prioritize interventions.`
                  },
                  {
                    type: 'table',
                    title: 'Global Metrics',
                    columns: ['metric', 'value'],
                    rows: [
                      { metric: 'Total Users', value: analyticsMetrics.total_users || 0 },
                      { metric: 'Total Plants', value: analyticsMetrics.total_plants || 0 },
                      { metric: 'Total Scans', value: analyticsMetrics.total_scans || 0 },
                      { metric: 'Diseased Scans', value: analyticsMetrics.diseased_scans || 0 },
                      { metric: 'Healthy Scans', value: analyticsMetrics.healthy_scans || 0 },
                      { metric: 'Disease Rate', value: `${analyticsMetrics.disease_rate || 0}%` },
                      { metric: 'Healthy Rate', value: `${analyticsMetrics.healthy_rate || 0}%` }
                    ]
                  },
                  {
                    type: 'table',
                    title: 'Top Diseases',
                    columns: ['name', 'count'],
                    rows: topDiseases.map((d) => ({
                      name: (d.name || '').replace(/_/g, ' '),
                      count: d.count || 0
                    }))
                  },
                  {
                    type: 'table',
                    title: 'Trend Data',
                    columns: ['label', 'total_scans', 'diseased_scans', 'healthy_scans', 'disease_rate'],
                    rows: trends.map((t) => ({
                      label: t.label,
                      total_scans: t.total_scans || 0,
                      diseased_scans: t.diseased_scans || 0,
                      healthy_scans: t.healthy_scans || 0,
                      disease_rate: `${t.disease_rate || 0}%`
                    }))
                  }
                ])}
              ><Download size={14} />Export PDF</button>
            </div>
          </div>

          <div className="admin-grid admin-grid-2">
            <div className="admin-panel-card">
              <div className="admin-section-title"><Activity size={16} /><h3>Disease Trend ({analyticsPeriod})</h3></div>
              {trends.length === 0 && <p className="admin-muted">No trend data yet.</p>}
              {trends.map((t) => (
                <div key={t.label} className="admin-progress-row">
                  <div><span>{t.label}</span><span>{formatPct(t.disease_rate)}</span></div>
                  <div className="admin-progress"><span style={{ width: `${Math.min(t.disease_rate, 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="admin-panel-card">
              <div className="admin-section-title"><ShieldAlert size={16} /><h3>Top Diseases</h3></div>
              <div className="admin-pie-wrap">
                <svg viewBox="0 0 240 180" className="admin-pie-chart" role="img" aria-label="Top diseases pie chart">
                  <g transform="translate(0, 6)">
                    {pieSlices.map((slice) => (
                      <path
                        key={slice.name}
                        d={describeArc(90, 84, 62, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        stroke="#f8fcf5"
                        strokeWidth="2"
                      />
                    ))}
                    <circle cx="90" cy="84" r="26" fill="#f8fcf5" />
                  </g>
                </svg>
                <div className="admin-pie-legend">
                  {pieSlices.map((slice) => (
                    <div key={`${slice.name}-legend`} className="admin-pie-legend-item">
                      <span className="admin-pie-dot" style={{ background: slice.color }} />
                      <small>{slice.name.replace(/_/g, ' ')}</small>
                      <strong>{slice.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-list">
                {topDiseases.map((d) => <div key={`${d.name}-row`}><span>{d.name.replace(/_/g, ' ')}</span><strong>{d.count}</strong></div>)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="admin-stack">
        <div className="admin-kpi-grid">
          <KpiCard icon={ShieldAlert} label="Open Reports" value={openReports} subtitle="Pending actions" tone="warn" />
          <KpiCard icon={MessageSquareWarning} label="Total Reports" value={totalReports} subtitle="Moderation queue" />
          <KpiCard icon={Users} label="Hidden Posts" value={hiddenPosts} subtitle="Content under restriction" />
          <KpiCard icon={ShieldCheck} label="Reviewed" value={Math.max(totalReports - openReports, 0)} subtitle="Resolved moderation tasks" tone="good" />
        </div>
        <div className="admin-panel-card">
          <div className="admin-section-title"><ShieldAlert size={16} /><h3>Moderation Controls</h3></div>
          <div className="admin-inline-actions">
            <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)}>
              <option value="open">Open reports</option><option value="dismissed">Dismissed</option><option value="warned">Warned</option><option value="removed">Removed</option><option value="all">All</option>
            </select>
            <button className="admin-btn" onClick={fetchCommunityModeration}><RefreshCw size={14} />Refresh</button>
          </div>
        </div>

        <div className="admin-grid admin-grid-2">
          <div className="admin-panel-card">
            <div className="admin-section-title"><AlertTriangle size={16} /><h3>Reports Queue</h3></div>
            <table className="admin-table">
              <thead><tr><th>Type</th><th>Reporter</th><th>Target User</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {communityReports.map((r) => (
                  <tr key={r._id}>
                    <td>{r.target_type}</td><td>{r.reporter_id?.email || '-'}</td><td>{r.target_user_id?.email || '-'}</td><td>{r.reason || '-'}</td>
                    <td><span className={`admin-status ${r.status === 'open' ? 'admin-status-warn' : 'admin-status-good'}`}>{r.status}</span></td>
                    <td className="admin-action-cell">
                      {r.status === 'open' && (
                        <>
                          <button className="admin-btn admin-btn-soft" onClick={() => handleResolveReport(r._id, 'dismiss')}>Dismiss</button>
                          <button className="admin-btn admin-btn-soft" onClick={() => handleResolveReport(r._id, 'warn')}>Warn</button>
                          <button className="admin-btn admin-btn-danger" onClick={() => handleResolveReport(r._id, 'remove')}>Remove</button>
                        </>
                      )}
                      {r.target_user_id?._id && <button className="admin-btn admin-btn-soft" onClick={() => handleMuteUser(r.target_user_id._id)}><MessageSquareWarning size={14} />Mute</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-title"><Users size={16} /><h3>Post Stream</h3></div>
            <div className="admin-feed">
              {communityPosts.map((p) => (
                <article key={p._id}>
                  <header>
                    <div>{p.user_id?.full_name || 'User'} <small>{p.user_id?.email || '-'}</small></div>
                    <time>{formatDateTime(p.createdAt)}</time>
                  </header>
                  <p>{p.caption || 'No caption'}</p>
                  <div className="admin-action-cell">
                    <button className="admin-btn admin-btn-soft" onClick={() => handleModeratePost(p._id, p.is_hidden ? 'unhide' : 'hide')}>{p.is_hidden ? 'Unhide' : 'Hide'}</button>
                    <button className="admin-btn admin-btn-soft" onClick={() => handleModeratePost(p._id, p.flagged_for_review ? 'unflag' : 'flag')}>{p.flagged_for_review ? 'Unflag' : 'Flag'}</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleModeratePost(p._id, 'delete')}>Delete</button>
                  </div>
                  <div className="admin-comments">
                    {(p.comments || []).slice(0, 2).map((c) => (
                      <div key={c._id}>
                        <span>{c.user_id?.email || 'User'}:</span> {c.text}
                        <button className="admin-link" onClick={() => handleModerateComment(p._id, c._id, c.is_hidden ? 'unhide' : 'hide')}>{c.is_hidden ? 'Unhide' : 'Hide'}</button>
                        <button className="admin-link" onClick={() => handleModerateComment(p._id, c._id, c.flagged_for_review ? 'unflag' : 'flag')}>{c.flagged_for_review ? 'Unflag' : 'Flag'}</button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span>Vera</span>
            <small>Admin Console</small>
          </div>
          <nav className="admin-tabs">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </aside>

        <section className="admin-main">
          <header className="admin-header">
            <div>
              <h1>{activeTabMeta.label}</h1>
              <p>Environmental operations, moderation, and reporting workspace.</p>
            </div>
            <button className="admin-btn" onClick={fetchTabData}><RefreshCw size={14} />Refresh Workspace</button>
          </header>

          {error && <div className="admin-alert admin-alert-error">{error}</div>}
          {success && <div className="admin-alert admin-alert-success">{success}</div>}

          {renderTabContent()}
        </section>
      </div>

      {showDeactivateModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <h3>Deactivate User</h3>
            <p>
              Select a reason for deactivating{' '}
              <strong>{deactivationUser?.full_name || deactivationUser?.email || 'this user'}</strong>.
            </p>
            <div className="admin-modal-field">
              <label>Reason</label>
              <select
                value={selectedDeactivationReason}
                onChange={(e) => setSelectedDeactivationReason(e.target.value)}
              >
                {DEACTIVATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            {selectedDeactivationReason === 'Other' && (
              <div className="admin-modal-field">
                <label>Custom reason</label>
                <input
                  type="text"
                  placeholder="Enter reason..."
                  value={customDeactivationReason}
                  onChange={(e) => setCustomDeactivationReason(e.target.value)}
                />
              </div>
            )}
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-soft" onClick={closeDeactivateModal}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={confirmDeactivateUser}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, tone = '' }) {
  return (
    <article className={`admin-kpi-card ${tone ? `admin-kpi-${tone}` : ''}`}>
      <div className="admin-kpi-head">
        <span><Icon size={15} /></span>
        <small>{label}</small>
      </div>
      <h3>{value}</h3>
      <p>{subtitle}</p>
    </article>
  );
}
