import React from 'react';
import { useCopro } from '../context/CoproContext';
import { FileDown } from 'lucide-react';

export default function DebtTracker() {
  const { data, getMatrixForResidence } = useCopro();
  
  const calculateDebts = () => {
    let list = [];
    (data.residences || []).forEach(res => {
       const costPerMonth = parseInt(res.cotisation) || 300;
       const activeYears = res.years || [2025];
       const matrix = getMatrixForResidence(res.id);
       
       Object.keys(matrix).forEach(apt => {
         const info = matrix[apt];
         let unpaidCount = 0;
         
         activeYears.forEach(year => {
             const yearMonths = info.years[year] || Array(12).fill('unpaid');
             unpaidCount += yearMonths.filter(m => m === 'unpaid').length;
         });
         
         if (unpaidCount > 0) {
           list.push({
             id: `${res.id}-${apt}`,
             resName: res.name,
             apt,
             client: info.client,
             months: unpaidCount,
             total: unpaidCount * costPerMonth
           });
         }
       });
    });
    return list.sort((a,b) => b.total - a.total);
  };

  const debts = calculateDebts();
  const totalDeficit = debts.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2>État Général des Arriérés</h2>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <FileDown size={18} /> Imprimer / PDF
        </button>
      </div>
      
      <div style={{marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid #e74c3c', borderRadius: '4px'}}>
        <h3 style={{color: '#e74c3c', margin: 0}}>Déficit Global : {totalDeficit.toLocaleString()} DH</h3>
        <p style={{marginTop: '0.5rem', color: 'var(--text-secondary)'}}>Cumul de {debts.length} dossiers en situation d'impayé sur l'ensemble des années.</p>
      </div>

      <div className="table-container">
        <table className="printable-table">
          <thead>
            <tr>
              <th>Résidence</th>
              <th>Appartement</th>
              <th>Propriétaire</th>
              <th>Cumul Retards</th>
              <th>Montant Total Dû</th>
            </tr>
          </thead>
          <tbody>
            {debts.map(d => (
              <tr key={d.id}>
                <td>{d.resName}</td>
                <td><strong>Apt #{d.apt}</strong></td>
                <td>{d.client}</td>
                <td><strong style={{color: '#e74c3c'}}>{d.months}</strong> mois</td>
                <td style={{fontWeight: 'bold', color: 'var(--color-gold)'}}>{d.total.toLocaleString()} DH</td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Aucun impayé enregistré sur l'ensemble du parc et des années suivies.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
