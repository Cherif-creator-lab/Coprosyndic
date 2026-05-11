import React from 'react';
import { useCopro } from '../context/CoproContext';
import { TrendingUp, AlertTriangle, Building, Wallet, Users, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const GOLD = '#d4af37';
const RED = '#e74c3c';
const GREEN = '#2ecc71';
const DARK_BG = '#1a1a1a';

export default function DashboardOverview() {
  const { data } = useCopro();
  const payments = data.payments || {};

  let globalCollected = 0;
  let globalUnpaid = 0;
  let activeResidences = data.residences?.length || 0;
  
  const residenceStats = [];
  const topDebtors = [];

  (data.residences || []).forEach(res => {
    const costPerMonth = parseInt(res.cotisation) || 300;
    const activeYears = res.years || [2025];
    const resPayments = payments[res.id] || {};
    
    let resCollected = 0;
    let resUnpaid = 0;
    
    Object.keys(resPayments).forEach(apt => {
        let aptUnpaid = 0;
        activeYears.forEach(year => {
           const months = resPayments[apt][year] || Array(12).fill('unpaid');
           months.forEach(status => {
              if(status === 'paid') {
                 resCollected += costPerMonth;
                 globalCollected += costPerMonth;
              } else {
                 resUnpaid += costPerMonth;
                 globalUnpaid += costPerMonth;
                 aptUnpaid += costPerMonth;
              }
           });
        });
        
        if (aptUnpaid > 0) {
            const clientObj = (data.clients || []).find(c => c.residenceId === res.id && c.aptNumber === apt);
            const clientName = clientObj ? clientObj.name : 'Inconnu';
            topDebtors.push({
               apt,
               client: clientName,
               residence: res.name,
               debt: aptUnpaid,
               residenceId: res.id
            });
        }
    });
    
    residenceStats.push({
       name: res.name,
       Recouvert: resCollected,
       Arrieres: resUnpaid,
       Taux: resCollected + resUnpaid > 0 ? Math.round((resCollected / (resCollected + resUnpaid)) * 100) : 0
    });
  });

  topDebtors.sort((a,b) => b.debt - a.debt);
  const worstDebtors = topDebtors.slice(0, 5);

  const globalRate = globalCollected + globalUnpaid > 0 ? ((globalCollected / (globalCollected + globalUnpaid)) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Recouverts', value: globalCollected },
    { name: 'Arrieres', value: globalUnpaid }
  ];
  const pieColors = [GOLD, RED];

  const kpiCards = [
    { label: 'Fonds Recouverts', value: globalCollected.toLocaleString() + ' DH', icon: <Wallet color={GOLD} size={24}/>, color: GOLD, bg: 'rgba(212,175,55,0.1)' },
    { label: 'Deficit (Arrieres)', value: globalUnpaid.toLocaleString() + ' DH', icon: <AlertTriangle color={RED} size={24}/>, color: RED, bg: 'rgba(231,76,60,0.1)' },
    { label: 'Taux Recouvrement', value: globalRate + '%', icon: <TrendingUp color="#3498db" size={24}/>, color: '#3498db', bg: 'rgba(52,152,219,0.1)' },
    { label: 'Residences Gerees', value: activeResidences + ' unites', icon: <Building color="#9b59b6" size={24}/>, color: '#9b59b6', bg: 'rgba(155,89,182,0.1)' },
  ];

  return (
    <div style={{paddingBottom: '2rem'}}>
      <div style={{marginBottom: '1.5rem'}}>
        <h1 style={{
          fontSize: 'clamp(1.2rem, 5vw, 2rem)',
          marginBottom: '0.2rem',
          background: 'linear-gradient(45deg, #d4af37, #f1c40f)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Vue d'Ensemble
        </h1>
        <p style={{color: 'var(--text-secondary)', margin: 0, fontSize: 'clamp(0.75rem, 3vw, 0.9rem)'}}>
          Copro Sync HT - Centre de pilotage
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} className="card" style={{
            background: 'linear-gradient(135deg, #1c1c1c, #121212)',
            borderTop: '3px solid ' + kpi.color,
            padding: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <div style={{backgroundColor: kpi.bg, padding: '0.5rem', borderRadius: '50%', flexShrink: 0}}>
              {kpi.icon}
            </div>
            <div style={{minWidth: 0}}>
              <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: 'clamp(0.6rem, 2.5vw, 0.8rem)', lineHeight: 1.2}}>{kpi.label}</p>
              <p style={{margin: '0.2rem 0 0 0', fontWeight: 700, color: kpi.color, fontSize: 'clamp(0.8rem, 3vw, 1.2rem)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>

        <div className="card" style={{padding: '1rem'}}>
          <h3 style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.85rem, 3.5vw, 1.2rem)'}}>
            <TrendingUp size={18} color={GOLD}/> Bilan par Residence
          </h3>
          <div style={{height: '220px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residenceStats} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 10}} />
                <YAxis stroke="#888" tickFormatter={(v) => v/1000 + 'k'} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: GOLD, borderRadius: '8px', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}}/>
                <Bar dataKey="Recouvert" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Arrieres" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
          <div className="card" style={{padding: '0.9rem'}}>
            <h3 style={{marginBottom: '0.5rem', textAlign: 'center', fontSize: 'clamp(0.75rem, 3vw, 1rem)'}}>Repartition</h3>
            <div style={{height: '160px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius="30%" outerRadius="55%" paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: GOLD, borderRadius: '8px', fontSize: '11px'}} />
                  <Legend verticalAlign="bottom" height={28} iconSize={8} wrapperStyle={{fontSize: '10px'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{padding: '0.9rem', overflow: 'hidden'}}>
            <h3 style={{marginBottom: '0.75rem', color: RED, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'clamp(0.75rem, 3vw, 1rem)'}}>
              <AlertTriangle size={14}/> Top Debiteurs
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {worstDebtors.slice(0, 4).map((deb, idx) => (
                <Link to={'/residence/' + deb.residenceId} key={idx} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div style={{padding: '0.5rem 0.6rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', borderLeft: '3px solid ' + RED}}>
                    <div style={{fontWeight: 'bold', fontSize: 'clamp(0.6rem, 2.5vw, 0.82rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{deb.client}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px'}}>
                      <span style={{fontSize: '0.6rem', color: 'var(--text-secondary)'}}>Apt #{deb.apt}</span>
                      <span style={{fontWeight: 'bold', color: RED, fontSize: 'clamp(0.6rem, 2.5vw, 0.78rem)'}}>{deb.debt.toLocaleString()} DH</span>
                    </div>
                  </div>
                </Link>
              ))}
              {worstDebtors.length === 0 && <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center'}}>Aucun arrier.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
