import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCopro } from '../context/CoproContext';
import { ArrowLeft, Trash2, CalendarPlus, FileDown, Receipt, Check, X } from 'lucide-react';
import logoUrl from '../assets/logo.png';

const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const monthsFrShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const monthsAr = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'اكتوبر', 'نونبر', 'دجنبر'];
const barcodePattern = [2,4,2,2,3,1,4,2,2,3,4,1,2,4,2,3,1,4,2,2,4,3,2,1,4,2,2,4,1,3,2,4,2,2,3,4,2,1,2,4];

export default function PaymentMatrix() {
  const { id } = useParams();
  const { data, togglePayment, getMatrixForResidence, addYearToResidence, removeYearFromResidence } = useCopro();
  
  const [newYear, setNewYear] = useState('');
  const [activeTab, setActiveTab] = useState('matrix');
  const [debtPeriod, setDebtPeriod] = useState('منذ فاتح غشت 2024 الى غاية نهاية شهر يوليوز 2025');
  
  const [receiptModal, setReceiptModal] = useState(null);
  const [printData, setPrintData] = useState(null);

  const residence = (data.residences || []).find(r => r.id === id);
  if(!residence) {
     return <div className="card">Résidence introuvable.</div>;
  }

  const matrix = getMatrixForResidence(id);
  const aptIds = Object.keys(matrix).sort((a,b) => parseInt(a) - parseInt(b));
  const dbYears = residence.years || [2025];
  const [hiddenYears, setHiddenYears] = useState([]);
  const activeYears = dbYears.filter(y => !hiddenYears.includes(y)).sort((a,b) => a - b);
  const costPerMonth = parseInt(residence.cotisation) || 300;

  const handleAddYear = () => {
     let y = parseInt(newYear);
     if (y > 2000 && y < 2100) { addYearToResidence(id, y); setNewYear(''); }
  };
  const handleRemoveYear = (year) => {
     if (window.confirm(`Supprimer DÉFINITIVEMENT l'année ${year} de la base de données ?`)) removeYearFromResidence(id, year);
  };
  const toggleYearVisibility = (year) => {
     setHiddenYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const debts = [];
  aptIds.forEach(apt => {
     const info = matrix[apt];
     let unpaidCount = 0;
     activeYears.forEach(year => {
         const yearMonths = info.years[year] || Array(12).fill('unpaid');
         unpaidCount += yearMonths.filter(m => m === 'unpaid').length;
     });
     if (unpaidCount > 0) {
       debts.push({
         apt,
         client: info.client,
         months: unpaidCount,
         total: unpaidCount * costPerMonth
       });
     }
  });
  debts.sort((a,b) => b.total - a.total);
  const totalDeficit = debts.reduce((sum, d) => sum + d.total, 0);

  const openReceiptModal = (d) => {
     const unpaidDetails = [];
     activeYears.forEach(year => {
        const yearMonths = matrix[d.apt].years[year] || Array(12).fill('unpaid');
        yearMonths.forEach((status, mIdx) => {
           if (status === 'unpaid') unpaidDetails.push({ year, mIdx });
        });
     });
     const clientObj = (data.clients || []).find(c => c.residenceId === id && c.aptNumber === d.apt) || {};
     
     setReceiptModal({ 
         apt: d.apt, 
         client: d.client, 
         clientFloor: clientObj.floor || '1',
         unpaidDetails, 
         selected: [] 
     });
  };

  const toggleMonthSelection = (m) => {
     setReceiptModal(prev => {
        const isSelected = prev.selected.some(s => s.year === m.year && s.mIdx === m.mIdx);
        let newSel;
        if (isSelected) {
           newSel = prev.selected.filter(s => !(s.year === m.year && s.mIdx === m.mIdx));
        } else {
           newSel = [...prev.selected, m];
        }
        return { ...prev, selected: newSel };
     });
  };

  const validateAndPrint = () => {
      if (receiptModal.selected.length === 0) {
         alert('Veuillez sélectionner au moins un mois à payer.');
         return;
      }
      
      receiptModal.selected.forEach(m => {
          togglePayment(id, m.year, receiptModal.apt, m.mIdx);
      });
      
      const sortedSelected = [...receiptModal.selected].sort((a,b) => {
         if(a.year !== b.year) return a.year - b.year;
         return a.mIdx - b.mIdx;
      });
      
      const paidMonthsStr = sortedSelected.map(m => `${monthsAr[m.mIdx]} ${m.year}`).join('، ');
      const total = sortedSelected.length * costPerMonth;
      
      setPrintData({
         apt: receiptModal.apt,
         client: receiptModal.client,
         clientFloor: receiptModal.clientFloor,
         paidMonthsStr,
         total
      });
      
      setReceiptModal(null);
      setActiveTab('receipt');
      setTimeout(() => window.print(), 500);
  };

  // Dynamic page size: A5 landscape for receipts, portrait for matrix/debts
  const pageSize = activeTab === 'receipt' ? '210mm 148mm' : 'portrait';
  const pageMargin = activeTab === 'receipt' ? '5mm' : '10mm';

  return (
    <div style={{position: 'relative'}}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar { display: none !important; }
          .main-content { padding: 0 !important; overflow: visible !important; background: white !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: ${pageSize}; margin: ${pageMargin}; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
      
      {/* RECEIPT MODAL */}
      {receiptModal && (
        <div className="no-print" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
           <div className="card" style={{width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                 <h2 style={{margin: 0}}>Paiement - Apt #{receiptModal.apt}</h2>
                 <button onClick={() => setReceiptModal(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}><X size={24}/></button>
              </div>
              <p>Propriétaire : <strong>{receiptModal.client}</strong></p>
              <p style={{marginBottom: '1.5rem', color: 'var(--text-secondary)'}}>Sélectionnez les mois que le client souhaite régler aujourd'hui :</p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem'}}>
                 {receiptModal.unpaidDetails.map(m => {
                    const isSelected = receiptModal.selected.some(s => s.year === m.year && s.mIdx === m.mIdx);
                    return (
                       <div key={`${m.year}-${m.mIdx}`} 
                            onClick={() => toggleMonthSelection(m)}
                            style={{padding: '0.5rem', border: `1px solid ${isSelected ? 'var(--color-gold)' : 'var(--border-color)'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'transparent', transition: 'all 0.2s'}}>
                          <div style={{width: '18px', height: '18px', border: '1px solid var(--text-secondary)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? 'var(--color-gold)' : 'transparent', borderColor: isSelected ? 'var(--color-gold)' : 'var(--text-secondary)'}}>
                             {isSelected && <Check size={14} color="#000" />}
                          </div>
                          <span>{monthsFr[m.mIdx]} {m.year}</span>
                       </div>
                    );
                 })}
                 {receiptModal.unpaidDetails.length === 0 && <p>Aucun mois impayé.</p>}
              </div>
              
              <div style={{padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                 <span>Total à payer</span>
                 <strong style={{fontSize: '1.5rem', color: 'var(--color-gold)'}}>{(receiptModal.selected.length * costPerMonth).toLocaleString()} DH</strong>
              </div>
              
              <button className="btn btn-primary" style={{width: '100%'}} onClick={validateAndPrint}>
                 <Receipt size={18} /> Valider le Paiement et Imprimer le Reçu
              </button>
           </div>
        </div>
      )}

      {/* SCREEN UI */}
      <div className="no-print">
        <div className="page-header" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <Link to="/residences" className="btn btn-outline" style={{padding: '0.5rem'}}><ArrowLeft size={20}/></Link>
          <h1 style={{margin: 0}}>{residence.name}</h1>
        </div>

        <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
           <button className={`btn ${activeTab === 'matrix' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('matrix')} style={{flex: 1}}>
             Matrice Globale
           </button>
           <button className={`btn ${activeTab === 'debts' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('debts')} style={{flex: 1}}>
             Dettes & Arriérés
           </button>
           <button className={`btn ${activeTab === 'receipt' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('receipt')} style={{flex: 1}} disabled={!printData}>
             Aperçu du Dernier Reçu
           </button>
        </div>
      
        {activeTab === 'matrix' && (
          <div className="card" style={{overflowX: 'auto'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem'}}>
            <div>
              <h2 style={{marginBottom: '0.5rem'}}>Matrice - Multi-Années</h2>
            </div>
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap'}}>
              <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '0.5rem'}}>Affichage :</span>
              {dbYears.sort((a,b)=>a-b).map(year => (
                <button key={year} onClick={() => toggleYearVisibility(year)} className={`btn ${hiddenYears.includes(year) ? 'btn-outline' : 'btn-primary'}`} style={{padding: '0.3rem 0.6rem', fontSize: '0.85rem'}}>
                   {year} {hiddenYears.includes(year) ? '👁️‍🗨️' : '👁️'}
                </button>
              ))}
              <div style={{width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem'}}></div>
              <input type="number" className="input-field" placeholder="Ex: 2026" style={{width: '90px', padding: '0.3rem'}} value={newYear} onChange={e => setNewYear(e.target.value)} />
              <button className="btn btn-outline" style={{padding: '0.3rem 0.6rem'}} onClick={handleAddYear} title="Ajouter à la base"><CalendarPlus size={16} /></button>
              <button className="btn btn-primary" style={{padding: '0.3rem 0.6rem'}} onClick={() => window.print()} title="Imprimer la matrice (PDF)"><FileDown size={16} /> PDF Arabe</button>
            </div>
          </div>
          
          {aptIds.length === 0 ? (
             <div style={{padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
                <p>Aucun appartement n'est suivi pour le moment.</p>
             </div>
          ) : (
            <div className="table-container">
              <table style={{ borderCollapse: 'collapse', border: '1px solid var(--border-gold)' }}>
                <thead>
                  <tr>
                    <th rowSpan="2" style={{borderRight: '1px solid var(--border-color)', verticalAlign: 'middle'}}>Apt</th>
                    <th rowSpan="2" style={{borderRight: '2px solid var(--border-gold)', verticalAlign: 'middle', minWidth: '150px'}}>Propriétaire</th>
                    {activeYears.map(year => (
                      <th key={year} colSpan={12} style={{textAlign: 'center', borderRight: '2px solid var(--border-gold)', backgroundColor: 'var(--bg-secondary)'}}>
                         <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
                           <span>{year}</span>
                           <button onClick={() => handleRemoveYear(year)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c'}}><Trash2 size={16} /></button>
                         </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {activeYears.map(year => (
                       monthsFrShort.map((m, i) => (
                         <th key={`${year}-${m}`} style={{textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem', borderRight: i === 11 ? '2px solid var(--border-gold)' : '1px solid var(--border-color)'}}>{m}</th>
                       ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aptIds.map(apt => {
                    const info = matrix[apt];
                    return (
                      <tr key={apt}>
                        <td style={{borderRight: '1px solid var(--border-color)'}}><strong>#{apt}</strong></td>
                        <td style={{borderRight: '2px solid var(--border-gold)'}}>{info.client}</td>
                        {activeYears.map(year => {
                           const yearMonths = info.years[year] || Array(12).fill('unpaid');
                           return yearMonths.map((status, index) => (
                             <td key={`${year}-${index}`} style={{textAlign: 'center', padding: '0.2rem', width: '35px', borderRight: index === 11 ? '2px solid var(--border-gold)' : '1px solid var(--border-color)'}}>
                               <div 
                                 className={`matrix-cell cell-${status}`}
                                 onClick={() => togglePayment(id, year, apt, index)}
                                 style={{margin: '0 auto', width: '25px', height: '25px'}}
                               ></div>
                             </td>
                           ))
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
              <h2>Arriérés de "{residence.name}"</h2>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input type="text" className="input-field" value={debtPeriod} onChange={e => setDebtPeriod(e.target.value)} placeholder="Période (Arabe)" style={{width: '350px'}} dir="rtl" />
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <FileDown size={18} /> PDF Dettes (Arabe)
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Appartement</th>
                    <th>Propriétaire</th>
                    <th>Mois en retard</th>
                    <th>Montant Dû</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(d => (
                    <tr key={d.apt}>
                      <td><strong>Apt #{d.apt}</strong></td>
                      <td>{d.client}</td>
                      <td><strong style={{color: '#e74c3c'}}>{d.months}</strong> mois</td>
                      <td style={{fontWeight: 'bold', color: 'var(--color-gold)'}}>{d.total.toLocaleString()} DH</td>
                      <td><button className="btn btn-outline" style={{padding: '0.4rem 0.8rem'}} onClick={() => openReceiptModal(d)}><Receipt size={16}/> Payer & Reçu</button></td>
                    </tr>
                  ))}
                  {debts.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Aucun impayé pour cette résidence !</td></tr>}
                </tbody>
                {debts.length > 0 && (
                  <tfoot>
                    <tr style={{backgroundColor: '#d4af37', border: '2px solid #d4af37'}}>
                      <td colSpan="3" style={{textAlign: 'right', fontSize: '1.4rem', fontWeight: 'bold', color: '#000', padding: '1rem'}}>
                        المجموع
                      </td>
                      <td colSpan="2" style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#000', padding: '1rem'}}>
                        {totalDeficit.toLocaleString()} درهم
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'receipt' && printData && (
          <div style={{padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
             <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}>
                <button className="btn btn-primary" onClick={() => window.print()}><FileDown size={18}/> Réimprimer ce reçu (A5)</button>
             </div>
             <p style={{textAlign: 'center', color: '#000'}}><em>(Aperçu du reçu — Format A5 paysage à l'impression)</em></p>
          </div>
        )}
      </div>

      {/* PRINT UI - MAPPED EXACTLY TO THE IMAGES IN ARABIC */}
      <div className="print-only" dir="rtl" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', width: '100%' }}>
         
         {/* Matrix Print Section */}
         {activeTab === 'matrix' && (
           <>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', marginBottom: '20px'}}>
                <img src={logoUrl} alt="Logo" style={{width: '90px'}} />
                <div style={{flex: 1, textAlign: 'center'}}>
                   <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold'}}>لائحة المساهمات الشهرية لملاك وساكنة اقامة "{residence.name}"</h2>
                   <h3 style={{margin: '0', fontSize: '18px', fontWeight: 'normal'}}>منذ تولي الشركة تسيير الاقامة</h3>
                </div>
             </div>
             <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid #000', textAlign: 'center', fontSize: '12px'}}>
                 <thead>
                   <tr>
                      <th style={{border: '1px solid #000', padding: '5px', backgroundColor: '#555', color: '#fff'}} rowSpan="2">العمارة</th>
                      <th style={{border: '1px solid #000', padding: '5px', backgroundColor: '#555', color: '#fff'}} rowSpan="2">رقم الشقة</th>
                      <th style={{border: '1px solid #000', padding: '5px', backgroundColor: '#555', color: '#fff'}} rowSpan="2">المالك</th>
                      {activeYears.map(year => (
                        <th key={year} colSpan={12} style={{border: '1px solid #000', padding: '5px', backgroundColor: '#888', color: '#fff'}}>{year}</th>
                      ))}
                   </tr>
                   <tr>
                      {activeYears.map(year => (
                         monthsAr.map((m, i) => (
                           <th key={`${year}-${m}`} style={{border: '1px solid #000', padding: '2px', fontSize: '10px', backgroundColor: '#555', color: '#fff'}}>{m}</th>
                         ))
                      ))}
                   </tr>
                 </thead>
                 <tbody>
                    {aptIds.map(apt => {
                      const info = matrix[apt];
                      return (
                        <tr key={apt}>
                          <td style={{border: '1px solid #000', padding: '5px', backgroundColor: '#e0e0e0'}}>{residence.name}</td>
                          <td style={{border: '1px solid #000', padding: '5px', fontWeight: 'bold', backgroundColor: '#e0e0e0'}}>{apt}</td>
                          <td style={{border: '1px solid #000', padding: '5px', backgroundColor: '#e0e0e0', fontSize: '10px'}}>{info.client}</td>
                          {activeYears.map(year => {
                             const yearMonths = info.years[year] || Array(12).fill('unpaid');
                             return yearMonths.map((status, index) => (
                               <td key={`${year}-${index}`} style={{border: '1px solid #000', padding: '0', height: '25px', backgroundColor: status === 'paid' ? '#f1c40f' : '#2980b9'}}>
                               </td>
                             ))
                          })}
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
              <div style={{marginTop: '20px', textAlign: 'center'}}>
                 <div style={{display: 'inline-flex', alignItems: 'center', gap: '10px', margin: '0 20px'}}>
                    <div style={{width: '60px', height: '20px', backgroundColor: '#f1c40f', border: '1px solid #000'}}></div>
                    <span style={{fontWeight: 'bold', fontSize: '14px'}}>مساهمة شهرية مستخلصة</span>
                 </div>
                 <div style={{display: 'inline-flex', alignItems: 'center', gap: '10px', margin: '0 20px'}}>
                    <div style={{width: '60px', height: '20px', backgroundColor: '#2980b9', border: '1px solid #000'}}></div>
                    <span style={{fontWeight: 'bold', fontSize: '14px'}}>متأخرات على مالك الشقة</span>
                 </div>
                 <p style={{fontWeight: 'bold', fontSize: '16px', marginTop: '20px'}}>ندعو جميع الملاك والساكنة الكرام الى الاتصال بالشركة لتسوية وضعيتهم وشكرا.</p>
              </div>
           </>
         )}

         {/* Debts Print Section */}
         {activeTab === 'debts' && (
           <>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', marginBottom: '20px'}}>
                <img src={logoUrl} alt="Logo" style={{width: '90px'}} />
                <div style={{flex: 1, textAlign: 'center'}}>
                   <div style={{backgroundColor: '#d4af37', padding: '10px 20px', display: 'inline-block', borderRadius: '5px', border: '2px solid #000'}}>
                     <h2 style={{margin: '0 0 5px 0', fontSize: '22px', fontWeight: 'bold', color: '#000'}}>جدول الديون المترتبة في ذمة بعض أعضاء اتحاد ملاك إقامة "{residence.name}"</h2>
                     <h3 style={{margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#000'}}>المتخلفين عن الأداء {debtPeriod}</h3>
                     <h4 style={{margin: '5px 0 0 0', fontSize: '14px', textDecoration: 'underline', color: '#000'}}>تاريخ تحيين المعلومات : {new Date().toLocaleDateString('fr-FR')}</h4>
                   </div>
                </div>
             </div>
              <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid #000', textAlign: 'center'}}>
                 <thead>
                   <tr style={{backgroundColor: '#fff'}}>
                      <th style={{border: '2px solid #000', padding: '10px'}}>ملاحظات</th>
                      <th style={{border: '2px solid #000', padding: '10px'}}>المبلغ الإجمالي</th>
                      <th style={{border: '2px solid #000', padding: '10px'}}>عدد الأشهر</th>
                      <th style={{border: '2px solid #000', padding: '10px'}}>المالك</th>
                      <th style={{border: '2px solid #000', padding: '10px'}}>رقم الشقة</th>
                      <th style={{border: '2px solid #000', padding: '10px'}}>العمارة</th>
                   </tr>
                 </thead>
                 <tbody>
                    {debts.map(d => (
                      <tr key={d.apt}>
                        <td style={{border: '1px solid #000', padding: '8px'}}></td>
                        <td style={{border: '1px solid #000', padding: '8px', fontSize: '18px'}}>{d.total.toLocaleString()} درهم</td>
                        <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold'}}>{d.months}</td>
                        <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold'}}>{d.client}</td>
                        <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold'}}>{d.apt}</td>
                        <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold'}}>{residence.name}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              <div style={{marginTop: '0px', backgroundColor: '#d4af37', padding: '15px', border: '2px solid #000', borderTop: 'none', textAlign: 'center', color: '#000'}}>
                  <h1 style={{margin: '0', fontSize: '32px', display: 'flex', justifyContent: 'center', gap: '20px'}}>
                     <span>{totalDeficit.toLocaleString()} درهم</span>
                     <span>المجموع</span>
                  </h1>
              </div>
           </>
         )}

         {/* Receipt Print Section — A5 LANDSCAPE (210mm x 148mm) */}
         {activeTab === 'receipt' && printData && (
           <div style={{width: '100%', height: '100%', padding: '8px', margin: '0 auto', boxSizing: 'border-box', fontSize: '11px'}}>
             
             {/* Header */}
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #999', paddingBottom: '8px', marginBottom: '10px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                   <img src={logoUrl} alt="Logo" style={{width: '55px'}} />
                   <div style={{fontSize: '10px', textAlign: 'left', direction: 'ltr'}}>
                      <strong>COPROSYNC H T</strong><br/>
                      Tel: 06.00.11.01.01
                   </div>
                </div>
                <div style={{textAlign: 'center', flex: 1}}>
                   <h2 style={{margin: 0, fontSize: '16px', fontWeight: 'bold'}}>اتحاد ملاك اقامة "{residence.name}"</h2>
                   <p style={{margin: '2px 0 0 0', fontSize: '10px', color: '#555'}}>{residence.address} - السجل العقاري: {residence.titreFoncier}</p>
                </div>
             </div>

             {/* Body: 2 columns */}
             <div style={{display: 'flex', gap: '15px', marginBottom: '10px'}}>
                
                {/* Right Column: Unit Info */}
                <div style={{flex: '0 0 45%'}}>
                   <h4 style={{textDecoration: 'underline', marginBottom: '6px', fontSize: '12px'}}>معلومات الوحدة المفرزة:</h4>
                   <p style={{margin: '4px 0', fontSize: '11px'}}><strong>رقم العمارة:</strong> {residence.name}</p>
                   <p style={{margin: '4px 0', fontSize: '11px'}}><strong>رقم القسمة المفرزة... بالطابق:</strong> {printData.clientFloor}</p>
                   <p style={{margin: '4px 0', fontSize: '11px'}}><strong>نوع الوحدة المفرزة:</strong> شقة</p>
                   <p style={{margin: '4px 0', fontSize: '11px'}}><strong>رقم الوحدة المفرزة:</strong> {printData.apt}</p>
                </div>

                {/* Left Column: Cotisation Box */}
                <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                   <div style={{border: '2px solid #000', padding: '10px', textAlign: 'center', width: '100%'}}>
                     <p style={{margin: 0, fontSize: '11px', fontWeight: 'bold', lineHeight: '1.6'}}>
                       المبلغ المحدد للوحدة المفرزة كواجب شهري حسب<br/>
                       نظام الملكية المشتركة خلال الموسم هو <span style={{fontSize: '14px'}}>{residence.cotisation}</span>
                     </p>
                   </div>
                </div>
             </div>

             {/* Payment Info */}
             <div style={{marginBottom: '10px'}}>
                <h4 style={{textDecoration: 'underline', marginBottom: '6px', fontSize: '12px'}}>معلومات الاداء:</h4>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <p style={{margin: '3px 0', fontSize: '12px'}}><strong>الاسم والنسب:</strong> <span style={{textTransform: 'uppercase'}}>{printData.client}</span></p>
                  <p style={{margin: '3px 0', fontSize: '12px'}}><strong>الصفة:</strong> (مالك)</p>
                </div>
                <p style={{margin: '6px 0', fontSize: '12px'}}><strong>عدد الاشهر المؤدى عنها:</strong> {printData.paidMonthsStr}</p>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <p style={{margin: '3px 0', fontSize: '14px', fontWeight: 'bold'}}><strong>المبلغ المؤدى بالدرهم:</strong> {printData.total} درهم</p>
                  <p style={{margin: '3px 0', fontSize: '12px'}}><strong>تاريخ الاداء:</strong> <span style={{direction: 'ltr', display: 'inline-block'}}>{new Date().toLocaleDateString('fr-FR')}</span></p>
                </div>
             </div>

             {/* Barcode */}
             <div style={{textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '8px'}}>
                <div style={{display: 'inline-flex', height: '35px', gap: '2px', marginBottom: '4px', alignItems: 'flex-end', justifyContent: 'center'}}>
                   {barcodePattern.map((width, i) => <div key={i} style={{width: width + 'px', height: '100%', backgroundColor: '#000'}}></div>)}
                </div>
                <p style={{margin: 0, fontFamily: 'monospace', letterSpacing: '3px', fontSize: '11px'}}>RC{Date.now().toString().slice(-6)}-RH{printData.apt.padStart(3, '0')}</p>
             </div>
             
             {/* Footer */}
             <div style={{marginTop: '6px', backgroundColor: '#eee', padding: '6px', textAlign: 'center', fontSize: '9px', border: '1px solid #ccc'}}>
                المقر الاجتماعي: {residence.address}
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
