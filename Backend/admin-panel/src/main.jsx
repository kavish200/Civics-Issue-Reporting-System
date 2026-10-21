import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const statuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const categories = ['road_damage', 'garbage', 'streetlight', 'water', 'drainage'];
const imageUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return `${origin}/${value.replace(/^\//, '')}`;
};

async function request(path, options = {}) {
  const token = localStorage.getItem('civics_admin_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('SESSION_EXPIRED');
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = await request('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (result.user?.role !== 'admin') throw new Error('This account does not have administrator access.');
      localStorage.setItem('civics_admin_token', result.token);
      onLogin(result.user);
    } catch (err) { setError(err.message === 'SESSION_EXPIRED' ? 'Invalid credentials.' : err.message); }
  };
  return <main className="login-shell"><form className="login-card" onSubmit={submit}>
    <p className="eyebrow">CIVICS / CONTROL ROOM</p><h1>Admin sign in</h1><p className="muted">Review reports, verify evidence, and route work to the field.</p>
    <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    {error && <div className="alert error">{error}</div>}<button className="primary full">Sign in</button>
  </form></main>;
}

function App() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [officers, setOfficers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const [issueData, statData, officerData] = await Promise.all([request(`/admin/issues?${query}`), request('/admin/stats'), request('/admin/officers')]);
      setIssues(issueData.issues || []); setStats(statData); setOfficers(officerData.officers || []);
    } catch (err) { if (err.message === 'SESSION_EXPIRED') logout(); else setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user) load(); }, [user, filters.status, filters.category]);
  const logout = () => { localStorage.removeItem('civics_admin_token'); setUser(null); setSelected(null); };
  const act = async (path, body) => {
    try { await request(path, { method: 'PATCH', body: JSON.stringify(body) }); setNotice('Action completed.'); setSelected(null); await load(); }
    catch (err) { setError(err.message === 'SESSION_EXPIRED' ? 'Your session expired.' : err.message); }
  };
  if (!user) return <Login onLogin={setUser} />;
  return <div className="app-shell"><header><div><p className="eyebrow">CIVICS / ADMIN</p><h1>Issue command center</h1></div><button className="quiet" onClick={logout}>Log out</button></header>
    <section className="stats">{[['All reports', stats.total], ['Needs review', (stats.byStatus?.Submitted || 0) + (stats.byStatus?.['Under Review'] || 0)], ['Assigned', stats.byStatus?.Assigned || 0], ['Rejected', stats.byStatus?.Rejected || 0], ['Resolved', stats.byStatus?.Resolved || 0]].map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    {notice && <div className="alert success">{notice}</div>}{error && <div className="alert error">{error}</div>}
    <section className="toolbar"><input placeholder="Search tracking ID or description" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && load()} /><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><button className="quiet" onClick={load}>Refresh</button></section>
    {loading ? <div className="empty">Loading reports...</div> : issues.length === 0 ? <div className="empty">No complaints match these filters.</div> : <div className="issue-grid">{issues.map((issue) => <article className="issue" key={issue._id} onClick={() => setSelected(issue)}><div className="issue-image">{issue.image ? <img src={imageUrl(issue.image)} alt="Complaint evidence" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span>No photo</span>}</div><div className="issue-content"><div className="row"><strong>{issue.trackingId}</strong><span className={`badge ${issue.status.toLowerCase().replaceAll(' ', '-')}`}>{issue.status}</span></div><h2>{issue.description}</h2><p className="muted">{issue.category} · {issue.location?.address || 'Location not provided'}</p><p className="muted">Reported by {issue.reporter?.name || 'Unknown'} · {new Date(issue.createdAt).toLocaleDateString()}</p></div></article>)}</div>}
    {selected && <Details issue={selected} officers={officers} close={() => setSelected(null)} act={act} />}
  </div>;
}

function Details({ issue, officers, close, act }) {
  const [officerId, setOfficerId] = useState(''); const [reason, setReason] = useState('');
  const [imageBroken, setImageBroken] = useState(false);
  const reviewable = ['Submitted', 'Under Review'].includes(issue.status);
  const approve = () => { if (!officerId || !window.confirm('Approve this complaint and assign it to the selected officer?')) return; act(`/admin/issues/${issue._id}/approve`, { officerId }); };
  const reject = () => { if (!reason.trim() || !window.confirm('Reject this complaint?')) return; act(`/admin/issues/${issue._id}/reject`, { reason }); };
  return <div className="overlay" onClick={close}><aside className="drawer" onClick={(event) => event.stopPropagation()}><button className="close" onClick={close}>Close</button><div className="large-photo">{issue.image && !imageBroken ? <img src={imageUrl(issue.image)} alt="Complaint evidence" onError={() => setImageBroken(true)} /> : <span>Evidence photo unavailable</span>}</div><p className="eyebrow">{issue.trackingId}</p><h2>{issue.description}</h2><p className="muted">{issue.location?.address || 'Location not provided'}</p><dl><dt>Category</dt><dd>{issue.category}</dd><dt>Reporter</dt><dd>{issue.reporter?.name || 'Unknown'} ({issue.reporter?.email || 'No email'})</dd><dt>Status</dt><dd>{issue.status}</dd><dt>Assigned officer</dt><dd>{issue.assignedTo?.name || 'Not assigned'}</dd>{issue.rejectionReason && <><dt>Rejection reason</dt><dd>{issue.rejectionReason}</dd></>}</dl>{reviewable && <div className="decision"><label>Assign to officer<select value={officerId} onChange={(event) => setOfficerId(event.target.value)}><option value="">Select an eligible officer</option>{officers.map((officer) => <option value={officer._id} key={officer._id}>{officer.name} · {officer.email}</option>)}</select></label><button className="primary full" disabled={!issue.image || imageBroken || !officerId} onClick={approve}>Approve and assign</button><label>Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this report is invalid" /></label><button className="danger full" disabled={!reason.trim()} onClick={reject}>Reject complaint</button>{(!issue.image || imageBroken) && <p className="hint">Approval is disabled until the complaint photo can be reviewed.</p>}</div>}</aside></div>;
}

createRoot(document.getElementById('root')).render(<App />);