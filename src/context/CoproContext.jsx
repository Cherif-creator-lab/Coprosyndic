import { createContext, useContext, useState, useEffect } from 'react';
import { sql } from '../neonClient';

const CoproContext = createContext();

export function CoproProvider({ children }) {
  const [data, setData] = useState({ residences: [], clients: [], payments: {}, paymentHistory: [] });
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, cliData, payData, histData] = await Promise.all([
          sql`SELECT * FROM residences ORDER BY created_at`,
          sql`SELECT * FROM clients ORDER BY created_at`,
          sql`SELECT * FROM payments`,
          sql`SELECT * FROM payment_history ORDER BY created_at DESC`
        ]);

        const mappedRes = (resData || []).map(r => ({
           id: r.id,
           name: r.name,
           address: r.address,
           titreFoncier: r.titre_foncier,
           apartments: r.apartments,
           cotisation: r.cotisation,
           years: r.years || [2025]
        }));

        const mappedCli = (cliData || []).map(c => ({
           id: c.id,
           residenceId: c.residence_id,
           name: c.name,
           aptNumber: c.apt_number,
           phone: c.phone,
           floor: c.floor,
           cin: c.cin
        }));

        // reconstruct payments object: payments[residenceId][aptNumber][year] = array of 12
        const paymentsObj = {};
        mappedRes.forEach(r => { paymentsObj[r.id] = {}; });

        (payData || []).forEach(p => {
           if (!paymentsObj[p.residence_id]) paymentsObj[p.residence_id] = {};
           if (!paymentsObj[p.residence_id][p.apt_number]) paymentsObj[p.residence_id][p.apt_number] = {};
           if (!paymentsObj[p.residence_id][p.apt_number][p.year]) {
              paymentsObj[p.residence_id][p.apt_number][p.year] = Array(12).fill('unpaid');
           }
           paymentsObj[p.residence_id][p.apt_number][p.year][p.month] = p.status;
        });

        setData({ residences: mappedRes, clients: mappedCli, payments: paymentsObj, paymentHistory: histData || [] });
      } catch (error) {
        console.error('Error fetching data from Neon:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addResidence = async (residence) => {
    try {
      const [newRes] = await sql`
        INSERT INTO residences (name, address, titre_foncier, apartments, cotisation, years)
        VALUES (${residence.name}, ${residence.address}, ${residence.titreFoncier},
                ${parseInt(residence.apartments) || 0}, ${parseInt(residence.cotisation) || 300}, ${[2025]})
        RETURNING *
      `;
      if (newRes) {
        const mapped = {
          id: newRes.id, name: newRes.name, address: newRes.address,
          titreFoncier: newRes.titre_foncier, apartments: newRes.apartments,
          cotisation: newRes.cotisation, years: newRes.years || [2025]
        };
        setData(prev => ({
          ...prev,
          residences: [...prev.residences, mapped],
          payments: { ...prev.payments, [mapped.id]: {} }
        }));
      }
    } catch (e) { console.error('addResidence error:', e); }
  };

  const addClient = async (client) => {
    try {
      const [newClient] = await sql`
        INSERT INTO clients (residence_id, name, apt_number, phone, floor, cin)
        VALUES (${client.residenceId}, ${client.name}, ${client.aptNumber},
                ${client.phone || null}, ${client.floor || null}, ${client.cin || null})
        RETURNING *
      `;
      if (newClient) {
        const mapped = {
          id: newClient.id, residenceId: newClient.residence_id, name: newClient.name,
          aptNumber: newClient.apt_number, phone: newClient.phone,
          floor: newClient.floor, cin: newClient.cin
        };
        setData(prev => {
          const newPayments = JSON.parse(JSON.stringify(prev.payments || {}));
          if (!newPayments[mapped.residenceId]) newPayments[mapped.residenceId] = {};
          if (!newPayments[mapped.residenceId][mapped.aptNumber]) newPayments[mapped.residenceId][mapped.aptNumber] = {};
          return { ...prev, clients: [...prev.clients, mapped], payments: newPayments };
        });
      }
    } catch (e) { console.error('addClient error:', e); }
  };

  const editClient = async (id, updatedClient) => {
    try {
      const [updated] = await sql`
        UPDATE clients SET
          residence_id = ${updatedClient.residenceId},
          name = ${updatedClient.name},
          apt_number = ${updatedClient.aptNumber},
          phone = ${updatedClient.phone || null},
          floor = ${updatedClient.floor || null},
          cin = ${updatedClient.cin || null}
        WHERE id = ${id}
        RETURNING *
      `;
      if (updated) {
        const mapped = {
          id: updated.id, residenceId: updated.residence_id, name: updated.name,
          aptNumber: updated.apt_number, phone: updated.phone,
          floor: updated.floor, cin: updated.cin
        };
        setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === id ? mapped : c) }));
      }
    } catch (e) { console.error('editClient error:', e); }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    try {
      await sql`DELETE FROM clients WHERE id = ${id}`;
      setData(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
    } catch (e) { console.error('deleteClient error:', e); }
  };

  const togglePayment = async (residenceId, year, aptNumber, monthIndex) => {
    let currentStatus = 'unpaid';

    // Optimistic UI update
    setData(prev => {
       const newPayments = JSON.parse(JSON.stringify(prev.payments || {}));
       if (!newPayments[residenceId]) newPayments[residenceId] = {};
       if (!newPayments[residenceId][aptNumber]) newPayments[residenceId][aptNumber] = {};
       if (!newPayments[residenceId][aptNumber][year]) {
           newPayments[residenceId][aptNumber][year] = Array(12).fill('unpaid');
       }
       currentStatus = newPayments[residenceId][aptNumber][year][monthIndex];
       newPayments[residenceId][aptNumber][year][monthIndex] = currentStatus === 'paid' ? 'unpaid' : 'paid';
       return { ...prev, payments: newPayments };
    });

    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';

    try {
      await sql`
        INSERT INTO payments (residence_id, apt_number, year, month, status)
        VALUES (${residenceId}, ${aptNumber}, ${year}, ${monthIndex}, ${newStatus})
        ON CONFLICT (residence_id, apt_number, year, month)
        DO UPDATE SET status = EXCLUDED.status
      `;
    } catch (e) { console.error('togglePayment error:', e); }
  };

  const logPaymentHistory = async (historyData) => {
    try {
      const [inserted] = await sql`
        INSERT INTO payment_history (residence_id, apt_number, client_name, receipt_id, paid_months_str, total_amount)
        VALUES (${historyData.residence_id}, ${historyData.apt_number}, ${historyData.client_name},
                ${historyData.receipt_id}, ${historyData.paid_months_str}, ${historyData.total_amount})
        RETURNING *
      `;
      if (inserted) {
        setData(prev => ({ ...prev, paymentHistory: [inserted, ...prev.paymentHistory] }));
      }
    } catch (e) { console.error('logPaymentHistory error:', e); }
  };

  const addYearToResidence = async (residenceId, year) => {
    const res = data.residences.find(r => r.id === residenceId);
    if (!res) return;
    const currentYears = res.years || [2025];
    if (currentYears.includes(year)) return;
    const newYears = [...currentYears, year].sort((a, b) => b - a);

    setData(prev => ({
      ...prev,
      residences: prev.residences.map(r => r.id === residenceId ? { ...r, years: newYears } : r)
    }));

    try {
      await sql`UPDATE residences SET years = ${newYears} WHERE id = ${residenceId}`;
    } catch (e) { console.error('addYearToResidence error:', e); }
  };

  const removeYearFromResidence = async (residenceId, year) => {
    const res = data.residences.find(r => r.id === residenceId);
    if (!res) return;
    const newYears = (res.years || []).filter(y => y !== year);

    setData(prev => ({
      ...prev,
      residences: prev.residences.map(r => r.id === residenceId ? { ...r, years: newYears } : r)
    }));

    try {
      await sql`UPDATE residences SET years = ${newYears} WHERE id = ${residenceId}`;
    } catch (e) { console.error('removeYearFromResidence error:', e); }
  };

  const getMatrixForResidence = (residenceId) => {
    const res = (data.residences || []).find(r => r.id === residenceId);
    if (!res) return {};
    const years = res.years || [2025];
    const resClients = (data.clients || []).filter(c => c.residenceId === residenceId);
    let matrix = {};

    resClients.forEach(c => {
       matrix[c.aptNumber] = { client: c.name, years: {} };
       years.forEach(y => {
           matrix[c.aptNumber].years[y] = (data.payments?.[residenceId]?.[c.aptNumber]?.[y]) || Array(12).fill('unpaid');
       });
    });

    const paymentRecords = (data.payments?.[residenceId]) || {};
    Object.keys(paymentRecords).forEach(apt => {
        if (!matrix[apt]) {
            matrix[apt] = { client: 'Locataire inconnu', years: {} };
            years.forEach(y => {
               matrix[apt].years[y] = paymentRecords[apt][y] || Array(12).fill('unpaid');
            });
        }
    });

    return matrix;
  };

  if (loading) {
    return (
       <div style={{display:'flex', flexDirection:'column', height:'100vh', justifyContent:'center', alignItems:'center', background:'var(--bg-primary)', color:'var(--color-gold)'}}>
          <div className="loader" style={{border: '4px solid rgba(212, 175, 55, 0.3)', borderTop: '4px solid var(--color-gold)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '1rem'}}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2>Synchronisation Sécurisée...</h2>
          <p style={{color: 'var(--text-secondary)'}}>Connexion à la base de données Neon.</p>
       </div>
    );
  }

  return (
    <CoproContext.Provider value={{ data, togglePayment, addResidence, addClient, editClient, deleteClient, addYearToResidence, removeYearFromResidence, getMatrixForResidence, logPaymentHistory }}>
      {children}
    </CoproContext.Provider>
  );
}

export const useCopro = () => useContext(CoproContext);
