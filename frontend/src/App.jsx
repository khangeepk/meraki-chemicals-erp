import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  TrendingUp, Package, Heart, Plus, Trash2, AlertTriangle, Edit2,
  UploadCloud, Sun, Moon, LogOut, User, Lock, Eye, EyeOff, Menu,
  ChevronRight, BarChart3, ShoppingCart, Settings, X, Check, Shield, UserPlus
} from 'lucide-react';

// Auto-detect environment: use relative URL on Vercel, localhost in dev
const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
const LOGO = '/assets/meraki-logo.png';
const getToken  = () => localStorage.getItem('meraki_token');
const getUser   = () => { try { return JSON.parse(localStorage.getItem('meraki_user')); } catch { return null; } };
const setAuth   = (t, u) => { localStorage.setItem('meraki_token', t); localStorage.setItem('meraki_user', JSON.stringify(u)); };
const clearAuth = () => { localStorage.removeItem('meraki_token'); localStorage.removeItem('meraki_user'); };

const MOCK_PURCH = [
  { prod_id: 1, purch_date: '2026-03-28', prod_name: 'Sulphuric Acid 98%', quantity: 150, prod_cost: '85.00', disc_availed: '250.00', purch_amount: '12500.00', carriage_offload_cost: '350.00', final_cost: '12850.00', per_item_rate: '85.67', purch_from: 'ChemCorp Ltd', contact_no: '0300-1234567', email: 'supply@chemcorp.pk' },
  { prod_id: 2, purch_date: '2026-03-29', prod_name: 'Sodium Hydroxide',   quantity: 80,  prod_cost: '120.00', disc_availed: '0.00',   purch_amount: '9600.00',  carriage_offload_cost: '200.00', final_cost: '9800.00',  per_item_rate: '122.50', purch_from: 'Allied Chemicals', contact_no: '0321-9876543', email: 'orders@allied.pk' },
];
const MOCK_SALES = [
  { sale_id: 1, prod_id: 1, prod_name: 'Sulphuric Acid 98%', sale_date: '2026-03-30', quantity: 30, prod_cost: '85.67', disc_availed: '0.00', sold_amount: '3600.00', sold_to: 'Textile Mills Pvt', gross_amount: '3600.00', net_profit: '1029.90', deduction_charity: '30.90', final_profit_sami: '545.85', final_profit_saif: '453.16', remaining_inventory: 120, remarks: '' },
];

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-base)] text-center">
          <AlertTriangle size={64} className="text-red-500 mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Something went wrong.</h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-8">We encountered an unexpected rendering fault. The session data may have failed to hydrate properly.</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn-primary">
            Clear Cache & Reload
          </button>
          <div className="mt-8 p-4 bg-red-900/10 border border-red-500/20 rounded-lg text-left max-w-2xl w-full overflow-auto">
            <code className="text-red-400 text-xs">{this.state.errorMsg}</code>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('meraki_theme') || 'dark');
  const [token, setToken] = useState(getToken);
  const [user,  setUser]  = useState(getUser);

  useEffect(() => { document.documentElement.className = theme; localStorage.setItem('meraki_theme', theme); }, [theme]);

  const handleLogin  = (t, u) => { setAuth(t, u); setToken(t); setUser(u); };
  const handleLogout = ()     => { clearAuth(); setToken(null); setUser(null); };
  const toggleTheme  = ()     => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const content = !token ? <LoginScreen onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} /> : <Dashboard token={token} user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
  
  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, theme, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/api/auth/login`, { username, password });
      if (res.data.success) onLogin(res.data.token, res.data.user);
    } catch (err) {
      if (username === 'admin' && password === 'admin') {
        onLogin('demo_token', { username: 'admin', role: 'Admin', permissions: { add: true, edit: true, delete: true } });
      } else {
        setError(err.response?.data?.error || 'Invalid credentials. Try admin / admin');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      {/* Theme toggle */}
      <button onClick={toggleTheme} className="theme-toggle" style={{ position:'fixed', top:'1.5rem', right:'1.5rem' }}>
        <div className="theme-toggle-thumb">{theme === 'dark' ? <Moon size={11} color="white"/> : <Sun size={11} color="white"/>}</div>
      </button>
      <div className="login-card animate-fade-in-up">
        {/* Official Meraki Logo */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <img
            src={LOGO}
            alt="Meraki Chemicals"
            className="meraki-logo"
            style={{ width:180, height:'auto', margin:'0 auto', borderRadius:12 }}
          />
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
          <Field label="Username" val={username} onChange={setUsername} icon={<User size={15}/>}/>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={15} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" className="glass-input" style={{ paddingLeft:'2.75rem', paddingRight:'3rem' }}/>
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          {error && <div style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:'0.5rem', padding:'0.6rem 1rem', color:'#f87171', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'0.5rem' }}><AlertTriangle size={13}/>{error}</div>}
          <button type="submit" disabled={loading} className="btn-login" style={{ marginTop:'0.25rem' }}>
            {loading ? 'Authenticating…' : <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>Sign In <ChevronRight size={16}/></span>}
          </button>
        </form>
        <div style={{ marginTop:'1.25rem', padding:'0.65rem 1rem', background:'rgba(13,148,136,0.08)', border:'1px solid rgba(13,148,136,0.18)', borderRadius:'0.6rem', fontSize:'0.78rem', color:'var(--text-muted)', textAlign:'center' }}>
          <Shield size={12} style={{ display:'inline', marginRight:'0.3rem', color:'var(--clr-teal-light)' }}/>Demo: <strong style={{ color:'var(--text-secondary)' }}>admin / admin</strong>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD SHELL ─────────────────────────────────────────────────────────
function Dashboard({ token, user, onLogout, theme, toggleTheme }) {
  // ── All hooks MUST come first — React Rules of Hooks ──────────────────────
  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [isNavOpen,      setIsNavOpen]      = useState(false);
  const [purchasingData, setPurchasingData] = useState([]);
  const [salesData,      setSalesData]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const ah = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([ axios.get(`${API}/api/purchasing`, ah), axios.get(`${API}/api/sales`, ah) ]);
      setPurchasingData(p.data.data?.length ? p.data.data : MOCK_PURCH);
      setSalesData(s.data.data?.length      ? s.data.data : MOCK_SALES);
    } catch { setPurchasingData(MOCK_PURCH); setSalesData(MOCK_SALES); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Guard: user not yet hydrated — show spinner AFTER all hooks ────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-[var(--bg-base)]">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-b-transparent border-[var(--clr-teal)]"></div>
        <p className="text-[var(--clr-teal)] font-semibold animate-pulse tracking-wider">VERIFYING PROFILE...</p>
        <button onClick={onLogout} className="mt-4 text-xs text-[var(--text-muted)] hover:text-red-400">Cancel &amp; Logout</button>
      </div>
    );
  }

  const tabs = [
    { id:'dashboard',  label:'Dashboard',   icon:<BarChart3 size={14}/> },
    { id:'purchasing', label:'Purchasing',   icon:<ShoppingCart size={14}/>, activeClass:'active-purchase' },
    { id:'sales',      label:'Sales',        icon:<TrendingUp size={14}/>,   activeClass:'active-sales' },
    ...(user?.role === 'Admin' ? [{ id:'admin', label:'Admin', icon:<Settings size={14}/>, activeClass:'active-admin' }] : []),
  ];

  return (
    <div className="min-h-screen p-3 md:p-5 max-w-[1600px] mx-auto">
      <header className="neo-surface p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50" style={{ backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)' }}>
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img src={LOGO} alt="Meraki Chemicals" className="meraki-logo-nav" />
            <div>
              <h1 className="gradient-text text-lg md:text-xl font-extrabold leading-none">Meraki Chemicals ERP</h1>
              <p className="text-[0.65rem] md:text-xs text-[var(--text-muted)]">Zero-Error Stock Management & Profit Sharing</p>
            </div>
          </div>
          <button className="md:hidden btn-secondary p-2" onClick={() => setIsNavOpen(!isNavOpen)}>
             {isNavOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>

        <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto transition-all ${isNavOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="tab-nav flex-col md:flex-row w-full md:w-auto">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn w-full md:w-auto justify-start md:justify-center ${activeTab === t.id ? ' '+(t.activeClass||'active') : ''}`} onClick={() => { setActiveTab(t.id); setIsNavOpen(false); }} style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>{t.icon}{t.label}</button>
            ))}
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-[var(--border-subtle)]">
            <span className="status-badge status-online hidden lg:inline-flex"><span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', display:'inline-block' }}/>Live</span>
            <button onClick={toggleTheme} className="theme-toggle">
              <div className="theme-toggle-thumb">{theme === 'dark' ? <Moon size={11} color="white"/> : <Sun size={11} color="white"/>}</div>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-raised)] rounded-lg border border-[var(--border-subtle)]">
              <User size={14} className="text-[var(--text-muted)]"/>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">{user?.username}</span>
            </div>
            <button onClick={onLogout} className="btn-secondary px-3 py-1.5"><LogOut size={16}/></button>
          </div>
        </div>
      </header>
      <main>
        {activeTab === 'dashboard'  && <DashboardView  purchasingData={purchasingData} salesData={salesData} loading={loading}/>}
        {activeTab === 'purchasing' && <PurchasingView data={purchasingData} setData={setPurchasingData} token={token} user={user}/>}
        {activeTab === 'sales'      && <SalesView      data={salesData}      setData={setSalesData}      purchasingData={purchasingData} token={token} user={user}/>}
        {activeTab === 'admin'      && user?.role === 'Admin' && <AdminPanel token={token}/>}
      </main>
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ purchasingData, salesData }) {
  const totalInv    = purchasingData.reduce((a,p) => a + Number(p.quantity)*Number(p.per_item_rate), 0);
  const totalProfit = salesData.reduce((a,s) => a + Number(s.net_profit), 0);
  const samiProfit  = salesData.reduce((a,s) => a + Number(s.final_profit_sami), 0);
  const saifProfit  = salesData.reduce((a,s) => a + Number(s.final_profit_saif), 0);
  const charity     = salesData.reduce((a,s) => a + Number(s.deduction_charity), 0);
  const lowStock    = purchasingData.filter(p => Number(p.quantity) < 30);
  const fmt = n => n.toLocaleString('en-PK',{minimumFractionDigits:2});

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total Inventory Value"   value={`Rs. ${fmt(totalInv)}`}    icon={<Package size={20}/>}       accent="#0d9488"/>
        <KPI title="Total Net Profit"        value={`Rs. ${fmt(totalProfit)}`} icon={<TrendingUp size={20}/>}    accent="#059669"/>
        <KPI title="Charity Fund (3%)"       value={`Rs. ${fmt(charity)}`}     icon={<Heart size={20}/>}         accent="#db2777"/>
        <KPI title="Low Stock Alerts"        value={`${lowStock.length} Items`} icon={<AlertTriangle size={20}/>} accent="#d97706" warn={lowStock.length>0}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfitCard title="Sami & Qaiser" pct="53%" value={`Rs. ${fmt(samiProfit)}`} color="var(--clr-purple-light)" bg="rgba(124,58,237,0.07)" bdr="rgba(124,58,237,0.2)"/>
        <ProfitCard title="Saif Traders"  pct="44%" value={`Rs. ${fmt(saifProfit)}`} color="var(--clr-cyan-light)"   bg="rgba(8,145,178,0.07)"  bdr="rgba(8,145,178,0.2)"/>
      </div>
      {lowStock.length > 0 && (
        <div className="neo-surface" style={{ padding:'1.25rem', borderTop:'3px solid #d97706' }}>
          <h3 style={{ fontWeight:700, color:'#fbbf24', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}><AlertTriangle size={15}/>Low Inventory</h3>
          {lowStock.map(p => (
            <div key={p.prod_id} style={{ display:'flex', justifyContent:'space-between', padding:'0.45rem 0.75rem', background:'rgba(217,119,6,0.08)', borderRadius:'0.5rem', marginBottom:'0.4rem', border:'1px solid rgba(217,119,6,0.2)' }}>
              <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{p.prod_name}</span>
              <span style={{ color:'#fbbf24', fontWeight:700 }}>{p.quantity} left</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ title, value, icon, accent, warn }) {
  return (
    <div className="kpi-card" style={{ borderBottom:`3px solid ${accent}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.85rem' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>{title}</p>
        <div style={{ padding:'0.55rem', borderRadius:'0.5rem', background:`${accent}18`, color:accent }}>{icon}</div>
      </div>
      <p style={{ fontSize:'1.5rem', fontWeight:800, color:warn?'#fbbf24':'var(--text-primary)', fontFamily:'monospace' }}>{value}</p>
    </div>
  );
}

function ProfitCard({ title, pct, value, color, bg, bdr }) {
  return (
    <div className="neo-surface" style={{ padding:'1.5rem', borderLeft:`4px solid ${color}`, background:bg }}>
      <h2 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'0.5rem' }}>{title} <span style={{ fontSize:'0.75rem', padding:'0.1rem 0.45rem', borderRadius:999, border:`1px solid ${bdr}`, color }}>{pct}</span></h2>
      <p style={{ fontSize:'2rem', fontWeight:900, fontFamily:'monospace', color:'var(--text-primary)', margin:'0.5rem 0' }}>{value}</p>
      <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.3rem' }}><Heart size={11} style={{ color:'#f472b6' }}/>Includes 3% charity deduction</p>
    </div>
  );
}

// ─── PURCHASING VIEW ──────────────────────────────────────────────────────────
function PurchasingView({ data, setData, token, user }) {
  const emptyForm = { prod_name:'', quantity:'', prod_cost:'', disc_availed:'', carriage_offload_cost:'', purch_from:'', contact_no:'', email:'', remarks:'' };
  const [form,    setForm]    = useState(emptyForm);
  const [cert,    setCert]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editRow, setEditRow] = useState(null); // holds row being edited

  const q=Number(form.quantity||0), p=Number(form.prod_cost||0), d=Number(form.disc_availed||0), c=Number(form.carriage_offload_cost||0);
  const purchAmt=p*q-d, finalCost=purchAmt+c, perItem=q>0?finalCost/q:0;
  const fmt = n => Number(n).toLocaleString('en-PK',{minimumFractionDigits:2});
  const can = (act) => user?.role==='Admin' || user?.permissions?.[act];

  // ── CREATE ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cert) return alert("Certify Sami → Saif receipt first!");
    setSaving(true);
    const newRow = { prod_id: Date.now(), purch_date: new Date().toISOString().split('T')[0], ...form, purch_amount: purchAmt.toFixed(2), final_cost: finalCost.toFixed(2), per_item_rate: perItem.toFixed(2) };
    try {
      const res = await axios.post(`${API}/api/purchasing`, { ...form, payment_certified:'true' }, { headers:{ Authorization:`Bearer ${token}` } });
      // BUG FIX: Use returned row from API; fall back to local calculation
      setData(prev => [res.data.data || newRow, ...prev]);
    } catch {
      setData(prev => [newRow, ...prev]); // instant state update even on API error
    }
    setForm(emptyForm); setCert(false); setSaving(false);
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    if (!editRow) return;
    const updated = { ...editRow };
    const eq=Number(updated.quantity||0), ep=Number(updated.prod_cost||0), ed=Number(updated.disc_availed||0), ec=Number(updated.carriage_offload_cost||0);
    updated.purch_amount = (ep*eq-ed).toFixed(2);
    updated.final_cost   = (Number(updated.purch_amount)+ec).toFixed(2);
    updated.per_item_rate= eq>0?(Number(updated.final_cost)/eq).toFixed(2):'0.00';
    try { await axios.put(`${API}/api/purchasing/${updated.prod_id}`, updated, { headers:{ Authorization:`Bearer ${token}` } }); } catch {}
    setData(prev => prev.map(r => r.prod_id===updated.prod_id ? updated : r));
    setEditRow(null);
  };

  // ── DELETE ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? Cannot delete if tied to sales.')) return;
    try { await axios.delete(`${API}/api/purchasing/${id}`, { headers:{ Authorization:`Bearer ${token}` } }); } catch {}
    setData(prev => prev.filter(r => r.prod_id !== id));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {/* ── ADD FORM ── */}
      {can('add') && (
        <div className="neo-surface" style={{ padding:'1.5rem', borderTop:'3px solid var(--clr-purple-light)' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <ShoppingCart size={17} style={{ color:'var(--clr-purple-light)' }}/> Record New Purchase
          </h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {['prod_name','quantity','prod_cost','disc_availed','carriage_offload_cost','purch_from','contact_no','email','remarks'].map(k => (
                <Field key={k} label={k} val={form[k]} onChange={v => setForm({...form,[k]:v})} type={['quantity','prod_cost','disc_availed','carriage_offload_cost'].includes(k)?'number':'text'} required={k!=='remarks'}/>
              ))}
            </div>
            <div className="neo-inset grid grid-cols-1 md:grid-cols-3 gap-2 p-3 mb-4 text-center border border-[rgba(13,148,136,0.12)]">
              <CalcCell label="Purch_Amount" value={`Rs. ${fmt(purchAmt)}`} color="var(--text-primary)"/>
              <CalcCell label="Final_Cost"   value={`Rs. ${fmt(finalCost)}`} color="var(--clr-teal-light)" divider/>
              <CalcCell label="Per_item_Rate" value={`Rs. ${fmt(perItem)}`} color="var(--clr-cyan-light)"  divider/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', padding:'0.85rem 1rem', background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.18)', borderRadius:'0.65rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', color:'var(--clr-purple-light)', fontWeight:600, fontSize:'0.9rem' }}>
                <input type="checkbox" checked={cert} onChange={e => setCert(e.target.checked)} style={{ width:17, height:17, accentColor:'var(--clr-purple-light)' }}/>
                <UploadCloud size={15}/> Upload &amp; Certify Sami → Saif Receipt
              </label>
              <button type="submit" disabled={saving} className="btn-primary"><Plus size={15}/>{saving?'Saving…':'Confirm Purchase'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── GRID ── */}
      <div className="neo-surface overflow-hidden">
        <div className="p-3 md:p-4 border-b border-[var(--border-subtle)] font-bold text-[var(--text-primary)] md:text-[0.9rem]">Purchasing Records ({data.length})</div>
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="data-table w-full">
            <thead><tr>{['ID','Date','Product','Qty','Cost','Disc','Purch_Amt','Carriage','Final_Cost','Rate/Item','From','Contact','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.prod_id}>
                  <td style={{ color:'var(--text-muted)' }}>#{r.prod_id}</td>
                  <td>{r.purch_date}</td><td className="highlight">{r.prod_name}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--text-primary)' }}>{r.quantity}</td>
                  <td className="mono" style={{ textAlign:'right' }}>{r.prod_cost}</td>
                  <td className="mono red" style={{ textAlign:'right' }}>{r.disc_availed}</td>
                  <td className="teal mono" style={{ textAlign:'right' }}>{r.purch_amount}</td>
                  <td className="mono" style={{ textAlign:'right' }}>{r.carriage_offload_cost}</td>
                  <td className="cyan mono" style={{ textAlign:'right' }}>{r.final_cost}</td>
                  <td style={{ textAlign:'right', color:'#fbbf24', fontWeight:700, fontFamily:'monospace' }}>{r.per_item_rate}</td>
                  <td>{r.purch_from}</td><td style={{ color:'var(--text-muted)' }}>{r.contact_no}</td>
                  <td style={{ display:'flex', gap:'0.4rem' }}>
                    {can('edit') && <button onClick={() => setEditRow({...r})} className="btn-secondary" style={{ padding:'0.3rem 0.55rem' }}><Edit2 size={12}/></button>}
                    {can('delete') && <button onClick={() => handleDelete(r.prod_id)} className="btn-danger" style={{ padding:'0.3rem 0.55rem' }}><Trash2 size={12}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editRow && (
        <Modal title="Edit Purchasing Record" onClose={() => setEditRow(null)} onSave={handleUpdate}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.75rem' }}>
            {['prod_name','quantity','prod_cost','disc_availed','carriage_offload_cost','purch_from','contact_no','remarks'].map(k => (
              <Field key={k} label={k} val={editRow[k]||''} onChange={v => setEditRow({...editRow,[k]:v})} type={['quantity','prod_cost','disc_availed','carriage_offload_cost'].includes(k)?'number':'text'} required={false}/>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SALES VIEW ───────────────────────────────────────────────────────────────
function SalesView({ data, setData, purchasingData, token, user }) {
  const emptyForm = { prod_id:'', quantity:'', sold_amount:'', disc_availed:'', sold_to:'', contact_no:'', email:'', remarks:'' };
  const [form,    setForm]    = useState(emptyForm);
  const [cert,    setCert]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editRow, setEditRow] = useState(null);

  const selProd = purchasingData.find(p => String(p.prod_id)===String(form.prod_id));
  const fCost = selProd ? Number(selProd.per_item_rate) : 0;
  const q=Number(form.quantity||0), s=Number(form.sold_amount||0), d=Number(form.disc_availed||0);
  const gross=s-d, net=gross-fCost*q, rem=selProd?Number(selProd.quantity)-q:0;
  const fmt = n => Number(n).toLocaleString('en-PK',{minimumFractionDigits:2});
  const can = (act) => user?.role==='Admin' || user?.permissions?.[act];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cert) return alert("Certify Saif → Sami receipt first!");
    if (rem < 0) return alert("Insufficient stock!");
    setSaving(true);
    const newRow = {
      sale_id: Date.now(), prod_id: form.prod_id, prod_name: selProd?.prod_name,
      sale_date: new Date().toISOString().split('T')[0], quantity: q, prod_cost: fCost.toFixed(2),
      disc_availed: d.toFixed(2), sold_amount: s.toFixed(2), sold_to: form.sold_to,
      contact_no: form.contact_no, email: form.email, gross_amount: gross.toFixed(2),
      net_profit: net.toFixed(2), deduction_charity: (net*0.03).toFixed(2),
      final_profit_sami: (net*0.53).toFixed(2), final_profit_saif: (net*0.44).toFixed(2),
      remaining_inventory: rem, remarks: form.remarks
    };
    try {
      const res = await axios.post(`${API}/api/sales`, { ...form, payment_certified:'true' }, { headers:{ Authorization:`Bearer ${token}` } });
      setData(prev => [res.data.data || newRow, ...prev]);
    } catch {
      setData(prev => [newRow, ...prev]);
    }
    setForm(emptyForm); setCert(false); setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editRow) return;
    try { await axios.put(`${API}/api/sales/${editRow.sale_id}`, editRow, { headers:{ Authorization:`Bearer ${token}` } }); } catch {}
    setData(prev => prev.map(r => r.sale_id===editRow.sale_id ? editRow : r));
    setEditRow(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete sale? Stock will be restored.')) return;
    try { await axios.delete(`${API}/api/sales/${id}`, { headers:{ Authorization:`Bearer ${token}` } }); } catch {}
    setData(prev => prev.filter(r => r.sale_id !== id));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {can('add') && (
        <div className="neo-surface" style={{ padding:'1.5rem', borderTop:'3px solid #34d399' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <TrendingUp size={17} style={{ color:'#34d399' }}/> Record Sales Transaction
          </h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Select Product (Prod_ID)</label>
                <select required value={form.prod_id} onChange={e => setForm({...form,prod_id:e.target.value})} className="glass-input">
                  <option value="">-- Choose --</option>
                  {purchasingData.map(p => <option key={p.prod_id} value={p.prod_id}>{p.prod_name} ({p.quantity} left @ Rs.{Number(p.per_item_rate).toFixed(2)})</option>)}
                </select>
              </div>
              {['quantity','sold_amount','disc_availed','sold_to','contact_no','email','remarks'].map(k => (
                <Field key={k} label={k} val={form[k]} onChange={v => setForm({...form,[k]:v})} type={['quantity','sold_amount','disc_availed'].includes(k)?'number':'text'} required={!['disc_availed','contact_no','email','remarks'].includes(k)}/>
              ))}
            </div>
            <div className="neo-inset grid grid-cols-2 md:grid-cols-4 gap-2 p-3 mb-4 text-center border border-[rgba(52,211,153,0.12)]">
              <CalcCell label="Cost/Item"   value={`Rs. ${fmt(fCost)}`}  color="var(--text-secondary)"/>
              <CalcCell label="Gross_Amt"   value={`Rs. ${fmt(gross)}`}  color="var(--text-primary)" divider/>
              <CalcCell label="Net_Profit"  value={`Rs. ${fmt(net)}`}    color={net>=0?'#34d399':'#f87171'} divider/>
              <CalcCell label="Remaining"   value={rem}                   color={rem<0?'#f87171':rem<10?'#fbbf24':'#34d399'} divider/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', padding:'0.85rem 1rem', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.18)', borderRadius:'0.65rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', color:'#34d399', fontWeight:600, fontSize:'0.9rem' }}>
                <input type="checkbox" checked={cert} onChange={e => setCert(e.target.checked)} style={{ width:17, height:17, accentColor:'#34d399' }}/>
                <UploadCloud size={15}/> Upload &amp; Certify Saif → Sami Receipt
              </label>
              <button type="submit" disabled={saving} className="btn-primary" style={{ background:'linear-gradient(135deg,#059669,#34d399)', boxShadow:'0 8px 20px rgba(5,150,105,0.3)' }}>
                <Plus size={15}/>{saving?'Processing…':'Process Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="neo-surface overflow-hidden">
        <div className="p-3 md:p-4 border-b border-[var(--border-subtle)] font-bold text-[var(--text-primary)] md:text-[0.9rem]">Sales Records ({data.length})</div>
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="data-table w-full">
            <thead><tr>{['Sale_ID','Product','Date','Qty','Cost','Sold','Gross','Net_Profit','Charity','Sami 53%','Saif 44%','Rem_Inv','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.sale_id}>
                  <td style={{ color:'var(--text-muted)' }}>#{r.sale_id}</td>
                  <td className="highlight">{r.prod_name}</td><td>{r.sale_date}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--text-primary)' }}>{r.quantity}</td>
                  <td className="mono" style={{ textAlign:'right' }}>{r.prod_cost}</td>
                  <td className="emerald mono" style={{ textAlign:'right' }}>{r.sold_amount}</td>
                  <td className="highlight mono" style={{ textAlign:'right' }}>{r.gross_amount}</td>
                  <td className="emerald mono" style={{ textAlign:'right', background:'rgba(52,211,153,0.06)' }}>{r.net_profit}</td>
                  <td className="pink mono" style={{ textAlign:'right' }}>{r.deduction_charity}</td>
                  <td className="purple mono" style={{ textAlign:'right' }}>{r.final_profit_sami}</td>
                  <td className="cyan mono" style={{ textAlign:'right' }}>{r.final_profit_saif}</td>
                  <td style={{ textAlign:'right', fontWeight:600, color:Number(r.remaining_inventory)<10?'#fbbf24':'var(--text-secondary)' }}>{r.remaining_inventory}</td>
                  <td style={{ display:'flex', gap:'0.4rem' }}>
                    {can('edit') && <button onClick={() => setEditRow({...r})} className="btn-secondary" style={{ padding:'0.3rem 0.55rem' }}><Edit2 size={12}/></button>}
                    {can('delete') && <button onClick={() => handleDelete(r.sale_id)} className="btn-danger" style={{ padding:'0.3rem 0.55rem' }}><Trash2 size={12}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editRow && (
        <Modal title="Edit Sale Record" onClose={() => setEditRow(null)} onSave={handleUpdate}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.75rem' }}>
            {['sold_to','contact_no','email','remarks'].map(k => (
              <Field key={k} label={k} val={editRow[k]||''} onChange={v => setEditRow({...editRow,[k]:v})} required={false}/>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ token }) {
  const ah = { headers: { Authorization: `Bearer ${token}` } };
  const [users,   setUsers]   = useState([]);
  const [company, setCompany] = useState({ Company_Name:'Meraki Chemicals', Contact:'0300-0000000', Address:'Lahore, Pakistan', Logo_Path:'' });
  const [newUser, setNewUser] = useState({ new_username:'', new_password:'', role:'User', permissions:{ add:false, edit:false, delete:false } });
  const [compSaved, setCompSaved] = useState(false);
  const [userSaved, setUserSaved] = useState(false);

  const saveCompany = async (e) => {
    e.preventDefault();
    try { await axios.post(`${API}/api/auth/company`, company, ah); } catch {}
    setCompSaved(true); setTimeout(() => setCompSaved(false), 2000);
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/admin/users`, newUser, ah);
      if (res.data.success) setUsers(prev => [...prev, res.data.user]);
    } catch {}
    setNewUser({ new_username:'', new_password:'', role:'User', permissions:{ add:false, edit:false, delete:false } });
    setUserSaved(true); setTimeout(() => setUserSaved(false), 2000);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete user?')) return;
    try { await axios.delete(`${API}/api/auth/admin/users/${id}`, ah); } catch {}
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const togglePerm = (perm) => setNewUser(u => ({ ...u, permissions: { ...u.permissions, [perm]: !u.permissions[perm] } }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {/* Company Profile */}
      <div className="neo-surface" style={{ padding:'1.5rem', borderTop:'3px solid var(--clr-teal-light)' }}>
        <h2 style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Settings size={17} style={{ color:'var(--clr-teal-light)' }}/> Company Profile
        </h2>
        <form onSubmit={saveCompany}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'0.85rem', marginBottom:'1rem' }}>
            <Field label="Company_Name" val={company.Company_Name} onChange={v => setCompany({...company,Company_Name:v})}/>
            <Field label="Contact"      val={company.Contact}      onChange={v => setCompany({...company,Contact:v})}/>
            <Field label="Address"      val={company.Address}      onChange={v => setCompany({...company,Address:v})} required={false}/>
            <Field label="Logo_Path"    val={company.Logo_Path}    onChange={v => setCompany({...company,Logo_Path:v})} required={false}/>
          </div>
          <button type="submit" className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {compSaved ? <><Check size={15}/> Saved!</> : <><Settings size={15}/> Save Company Profile</>}
          </button>
        </form>
      </div>

      {/* User Management */}
      <div className="neo-surface" style={{ padding:'1.5rem', borderTop:'3px solid var(--clr-purple-light)' }}>
        <h2 style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <UserPlus size={17} style={{ color:'var(--clr-purple-light)' }}/> User Management
        </h2>
        <form onSubmit={createUser}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.85rem', marginBottom:'1rem' }}>
            <Field label="Username" val={newUser.new_username} onChange={v => setNewUser({...newUser,new_username:v})}/>
            <Field label="Password" val={newUser.new_password} onChange={v => setNewUser({...newUser,new_password:v})} type="password"/>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              <label style={labelStyle}>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser,role:e.target.value})} className="glass-input">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              <label style={labelStyle}>Permissions</label>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.45rem', padding:'0.5rem 0.75rem', background:'var(--bg-base)', borderRadius:'0.5rem', border:'1px solid var(--border-medium)' }}>
                {['add','edit','delete'].map(p => (
                  <label key={p} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem', color:'var(--text-secondary)', textTransform:'capitalize' }}>
                    <input type="checkbox" checked={newUser.permissions[p]} onChange={() => togglePerm(p)} style={{ accentColor:'var(--clr-purple-light)' }}/> {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            {userSaved ? <><Check size={15}/> User Created!</> : <><UserPlus size={15}/> Create User</>}
          </button>
        </form>

        {users.length > 0 && (
          <div style={{ marginTop:'1.25rem' }}>
            <h3 style={{ fontWeight:600, color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:'0.65rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Existing Users</h3>
            {users.map(u => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 0.85rem', background:'var(--bg-raised)', borderRadius:'0.5rem', marginBottom:'0.4rem', border:'1px solid var(--border-subtle)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                  <User size={14} style={{ color:'var(--text-muted)' }}/>
                  <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{u.username}</span>
                  <span style={{ fontSize:'0.7rem', padding:'0.1rem 0.4rem', borderRadius:999, background:'rgba(124,58,237,0.12)', color:'var(--clr-purple-light)', fontWeight:600 }}>{u.role}</span>
                </div>
                <button onClick={() => deleteUser(u.id)} className="btn-danger" style={{ padding:'0.3rem 0.55rem' }}><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const labelStyle = { fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' };

function Field({ label, val, onChange, type='text', required=true }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
      <label style={labelStyle}>{label}</label>
      <input required={required} type={type} step="any" value={val} onChange={e => onChange(e.target.value)} className="glass-input" placeholder={`${label}…`}/>
    </div>
  );
}

function CalcCell({ label, value, color, divider }) {
  return (
    <div style={{ borderLeft:divider?'1px solid var(--border-subtle)':'none', paddingLeft:divider?'0.5rem':0 }}>
      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
      <p style={{ fontSize:'1.05rem', fontWeight:800, fontFamily:'monospace', color }}>{value}</p>
    </div>
  );
}

function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div className="neo-surface animate-fade-in-up" style={{ width:'100%', maxWidth:640, MaxHeight:'90vh', overflowY:'auto', padding:'1.75rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h3 style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding:'0.35rem 0.6rem' }}><X size={15}/></button>
        </div>
        {children}
        <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave}  className="btn-primary"><Check size={14}/> Save Changes</button>
        </div>
      </div>
    </div>
  );
}
