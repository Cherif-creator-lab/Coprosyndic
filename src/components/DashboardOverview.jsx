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
       Arriérés: resUnpaid,
       Taux: resCollected + resUnpaid > 0 ? Math.round((resCollected / (resCollected + resUnpaid)) * 100) : 0
    });
  });

  topDebtors.sort((a,b) => b.debt - a.debt);
  const worstDebtors = topDebtors.slice(0, 5);

  const globalRate = globalCollected + globalUnpaid > 0 ? ((globalCollected / (globalCollected + globalUnpaid)) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Fonds Recouverts', value: globalCollected },
    { name: 'Arriérés', value: globalUnpaid }
  ];
  const pieColors = [GOLD, RED];

  return (
    <div style={{paddingBottom: '2rem'}}>
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
           <h1 style={{fontSize: '2rem', marginBottom: '0.2rem', background: 'linear-gradient(45deg, #d4af37, #f1c40f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Vue d'Ensemble Premium</h1>
           <p style={{color: 'var(--text-secondary)', margin: 0}}>Copro Sync HT - Centre de pilotage central</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
         <div className="card" style={{background: 'linear-gradient(135deg, #1c1c1c, #121212)', borderTop: `3px solid ${GOLD}`, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div style={{backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '50%'}}>
                 <Wallet color={GOLD} size={28} />
             </div>
             <div>
                 <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Fonds Recouverts</p>
                 <h2 style={{margin: '0.2rem 0', fontSize: '1.8rem'}}>{globalCollected.toLocaleString()} <span style={{fontSize: '1rem'}}>DH</span></h2>
             </div>
         </div>
         <div className="card" style={{background: 'linear-gradient(135deg, #1c1c1c, #121212)', borderTop: `3px solid ${RED}`, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div style={{backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '1rem', borderRadius: '50%'}}>
                 <AlertTriangle color={RED} size={28} />
             </div>
             <div>
                 <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Déficit (Arriérés)</p>
                 <h2 style={{margin: '0.2rem 0', fontSize: '1.8rem', color: RED}}>{globalUnpaid.toLocaleString()} <span style={{fontSize: '1rem'}}>DH</span></h2>
             </div>
         </div>
         <div className="card" style={{background: 'linear-gradient(135deg, #1c1c1c, #121212)', borderTop: `3px solid #3498db`, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div style={{backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: '1rem', borderRadius: '50%'}}>
                 <TrendingUp color="#3498db" size={28} />
             </div>
             <div>
                 <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Taux de Recouvrement</p>
                 <h2 style={{margin: '0.2rem 0', fontSize: '1.8rem'}}>{globalRate}%</h2>
             </div>
         </div>
         <div className="card" style={{background: 'linear-gradient(135deg, #1c1c1c, #121212)', borderTop: `3px solid #9b59b6`, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div style={{backgroundColor: 'rgba(155, 89, 182, 0.1)', padding: '1rem', borderRadius: '50%'}}>
                 <Building color="#9b59b6" size={28} />
             </div>
             <div>
                 <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Résidences Gérées</p>
                 <h2 style={{margin: '0.2rem 0', fontSize: '1.8rem'}}>{activeResidences} <span style={{fontSize: '1rem'}}>Unités</span></h2>
             </div>
         </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem'}}>
         
         {/* Main Chart */}
         <div className="card" style={{height: '400px'}}>
             <h3 style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><TrendingUp size={20} color={GOLD}/> Bilan Financier par Résidence</h3>
             <ResponsiveContainer width="100%" height="85%">
                <BarChart data={residenceStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                   <XAxis dataKey="name" stroke="#888" tick={{fontSize: 12}} />
                   <YAxis stroke="#888" tickFormatter={(value) => `${value/1000}k`} />
                   <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#111', borderColor: GOLD, borderRadius: '8px'}}
                      itemStyle={{color: '#fff'}}
                   />
                   <Legend wrapperStyle={{paddingTop: '20px'}}/>
                   <Bar dataKey="Recouvert" fill={GOLD} radius={[4, 4, 0, 0]} />
                   <Bar dataKey="Arriérés" fill={RED} radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
         </div>

         {/* Secondary Chart & Top Debtors */}
         <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div className="card" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
               <h3 style={{marginBottom: '1rem', textAlign: 'center'}}>Répartition Globale</h3>
               <div style={{flex: 1, minHeight: '200px'}}>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                         >
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                           ))}
                         </Pie>
                         <Tooltip contentStyle={{backgroundColor: '#111', borderColor: GOLD, borderRadius: '8px'}} />
                         <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                   </ResponsiveContainer>
               </div>
            </div>

            <div className="card" style={{flex: 1, padding: '1.5rem'}}>
                <h3 style={{marginBottom: '1.5rem', color: RED, display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertTriangle size={18}/> Top 5 Débiteurs</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {worstDebtors.map((deb, idx) => (
                        <Link to={`/residence/${deb.residenceId}`} key={idx} style={{textDecoration: 'none', color: 'inherit'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', borderLeft: `3px solid ${RED}`, transition: 'background 0.2s', cursor: 'pointer'}}>
                               <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.95rem'}}>{deb.client}</div>
                                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{deb.residence} - Apt #{deb.apt}</div>
                               </div>
                               <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                  <span style={{fontWeight: 'bold', color: RED}}>{deb.debt.toLocaleString()} DH</span>
                                  <ChevronRight size={16} color="var(--text-secondary)"/>
                               </div>
                            </div>
                        </Link>
                    ))}
                    {worstDebtors.length === 0 && <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>Aucun arriéré détecté.</p>}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
