import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, LogOut } from 'lucide-react';
import { useState } from 'react';
import './index.css';
import logoUrl from './assets/logo.png';
import { CoproProvider } from './context/CoproContext';
import DashboardOverview from './components/DashboardOverview';
import ResidencesList from './components/ResidencesList';
import ClientManagement from './components/ClientManagement';
import PaymentMatrix from './components/PaymentMatrix';

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { name: 'Tableau de Bord', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Résidences', path: '/residences', icon: <Building2 size={20} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={20} /> }
  ];

  const isActive = (path) => {
     if (path === '/' && location.pathname === '/') return true;
     if (path !== '/' && location.pathname.startsWith(path)) return true;
     if (path === '/residences' && location.pathname.startsWith('/residence/')) return true;
     return false;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
        <img src={logoUrl} alt="CoproSync Logo" style={{ width: '80px', height: 'auto', marginBottom: '0.5rem', objectFit: 'contain' }} />
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>CoproSync</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>Syndic Premium</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
            {item.icon}
            {item.name}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', padding: '1.5rem 0' }}>
           <button className="nav-item" style={{ color: '#e74c3c' }}>
             <LogOut size={20} /> Déconnexion
           </button>
        </div>
      </nav>
    </aside>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', background: 'var(--bg-primary)'}}>
        <img src={logoUrl} alt="CoproSync Logo" style={{ width: '180px', height: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 8px 32px rgba(212, 175, 55, 0.3))' }} />
        <h1 style={{marginBottom: '0.5rem', textAlign: 'center'}}>COPRO SYNC HT</h1>
        <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Application de Gestion Exclusive</p>
        
        <div className="card" style={{width: '100%', maxWidth: '400px'}}>
            <div className="input-group">
                <label className="input-label">Identifiant Administrateur</label>
                <input type="text" className="input-field" defaultValue="admin@coprosync.ma" />
            </div>
            <div className="input-group" style={{marginBottom: '1.5rem'}}>
                <label className="input-label">Mot de passe</label>
                <input type="password" className="input-field" defaultValue="****" />
            </div>
            <button className="btn btn-primary" style={{width: '100%'}} onClick={() => setIsAuthenticated(true)}>
            Se connecter
            </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <CoproProvider>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/residences" element={<ResidencesList />} />
              <Route path="/residence/:id" element={<PaymentMatrix />} />
              <Route path="/clients" element={<ClientManagement />} />
            </Routes>
          </main>
        </div>
      </CoproProvider>
    </Router>
  );
}
