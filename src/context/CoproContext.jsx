import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CoproContext = createContext();

export function CoproProvider({ children }) {
  const [data, setData] = useState({ residences: [], clients: [], payments: {} });
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: resData, error: errRes } = await supabase.from('residences').select('*');
        const { data: cliData, error: errCli } = await supabase.from('clients').select('*');
        const { data: payData, error: errPay } = await supabase.from('payments').select('*');
        
        if (errRes || errCli || errPay) {
            console.error("Supabase Error:", errRes || errCli || errPay);
        }

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

        // reconstruct payments object structure: payments[residenceId][aptNumber][year] = array of 12 statuses
        const paymentsObj = {};
        
        mappedRes.forEach(r => { paymentsObj[r.id] = {}; });
        
        if (payData) {
            payData.forEach(p => {
               if (!paymentsObj[p.residence_id]) paymentsObj[p.residence_id] = {};
               if (!paymentsObj[p.residence_id][p.apt_number]) paymentsObj[p.residence_id][p.apt_number] = {};
               if (!paymentsObj[p.residence_id][p.apt_number][p.year]) {
                  paymentsObj[p.residence_id][p.apt_number][p.year] = Array(12).fill('unpaid');
               }
               paymentsObj[p.residence_id][p.apt_number][p.year][p.month] = p.status;
            });
        }

        setData({ residences: mappedRes, clients: mappedCli, payments: paymentsObj });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addResidence = async (residence) => {
    const { data: newRes, error } = await supabase
      .from('residences')
      .insert([{ 
         name: residence.name, 
         address: residence.address, 
         titre_foncier: residence.titreFoncier, 
         apartments: parseInt(residence.apartments) || 0, 
         cotisation: parseInt(residence.cotisation) || 300, 
         years: [2025] 
      }])
      .select().single();

    if (!error && newRes) {
      const mapped = {
           id: newRes.id,
           name: newRes.name,
           address: newRes.address,
           titreFoncier: newRes.titre_foncier,
           apartments: newRes.apartments,
           cotisation: newRes.cotisation,
           years: newRes.years || [2025]
      };
      setData(prev => ({
        ...prev,
        residences: [...prev.residences, mapped],
        payments: { ...prev.payments, [mapped.id]: {} }
      }));
    }
  };

  const addClient = async (client) => {
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([{
         residence_id: client.residenceId,
         name: client.name,
         apt_number: client.aptNumber,
         phone: client.phone,
         floor: client.floor,
         cin: client.cin
      }])
      .select().single();

    if (!error && newClient) {
      const mapped = {
           id: newClient.id,
           residenceId: newClient.residence_id,
           name: newClient.name,
           aptNumber: newClient.apt_number,
           phone: newClient.phone,
           floor: newClient.floor,
           cin: newClient.cin
      };
      setData(prev => {
         const newClients = [...prev.clients, mapped];
         const newPayments = JSON.parse(JSON.stringify(prev.payments || {}));
         if (!newPayments[mapped.residenceId]) newPayments[mapped.residenceId] = {};
         if (!newPayments[mapped.residenceId][mapped.aptNumber]) {
             newPayments[mapped.residenceId][mapped.aptNumber] = {};
         }
         return { ...prev, clients: newClients, payments: newPayments };
      });
    }
  };

  const editClient = async (id, updatedClient) => {
    const { data: updatedClientData, error } = await supabase
      .from('clients')
      .update({
         residence_id: updatedClient.residenceId,
         name: updatedClient.name,
         apt_number: updatedClient.aptNumber,
         phone: updatedClient.phone,
         floor: updatedClient.floor,
         cin: updatedClient.cin
      })
      .eq('id', id)
      .select().single();

    if (!error && updatedClientData) {
      const mapped = {
           id: updatedClientData.id,
           residenceId: updatedClientData.residence_id,
           name: updatedClientData.name,
           aptNumber: updatedClientData.apt_number,
           phone: updatedClientData.phone,
           floor: updatedClientData.floor,
           cin: updatedClientData.cin
      };
      setData(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === id ? mapped : c)
      }));
    }
  };

  const deleteClient = async (id) => {
    if(!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      setData(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== id)
      }));
    }
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

    // Upsert to DB
    const { data: existing } = await supabase
       .from('payments')
       .select('id')
       .eq('residence_id', residenceId)
       .eq('apt_number', aptNumber)
       .eq('year', year)
       .eq('month', monthIndex)
       .maybeSingle();

    if (existing) {
       await supabase.from('payments').update({ status: newStatus }).eq('id', existing.id);
    } else {
       await supabase.from('payments').insert([{
           residence_id: residenceId,
           apt_number: aptNumber,
           year,
           month: monthIndex,
           status: newStatus
       }]);
    }
  };

  const addYearToResidence = async (residenceId, year) => {
    const res = data.residences.find(r => r.id === residenceId);
    if (!res) return;
    const currentYears = res.years || [2025];
    if (currentYears.includes(year)) return;
    
    const newYears = [...currentYears, year].sort((a,b) => b - a);

    // Optimistic Update
    setData(prev => ({
      ...prev,
      residences: prev.residences.map(r => r.id === residenceId ? { ...r, years: newYears } : r)
    }));

    // DB Update
    await supabase.from('residences').update({ years: newYears }).eq('id', residenceId);
  };

  const removeYearFromResidence = async (residenceId, year) => {
    const res = data.residences.find(r => r.id === residenceId);
    if (!res) return;
    const newYears = (res.years || []).filter(y => y !== year);

    // Optimistic
    setData(prev => ({
      ...prev,
      residences: prev.residences.map(r => r.id === residenceId ? { ...r, years: newYears } : r)
    }));

    // DB
    await supabase.from('residences').update({ years: newYears }).eq('id', residenceId);
  };

  const getMatrixForResidence = (residenceId) => {
    const res = (data.residences || []).find(r => r.id === residenceId);
    if (!res) return {};
    
    const years = res.years || [2025];
    const resClients = (data.clients || []).filter(c => c.residenceId === residenceId);
    let matrix = {};
    
    resClients.forEach(c => {
       matrix[c.aptNumber] = {
           client: c.name,
           years: {}
       };
       years.forEach(y => {
           matrix[c.aptNumber].years[y] = (data.payments && data.payments[residenceId]?.[c.aptNumber]?.[y]) || Array(12).fill('unpaid');
       });
    });

    const paymentRecords = (data.payments && data.payments[residenceId]) || {};
    Object.keys(paymentRecords).forEach(apt => {
        if (!matrix[apt]) {
            matrix[apt] = {
                client: 'Locataire inconnu',
                years: {}
            };
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
            <p style={{color: 'var(--text-secondary)'}}>Connexion à la base de données cloud.</p>
         </div>
      );
  }

  return (
    <CoproContext.Provider value={{ data, togglePayment, addResidence, addClient, editClient, deleteClient, addYearToResidence, removeYearFromResidence, getMatrixForResidence }}>
      {children}
    </CoproContext.Provider>
  );
}

export const useCopro = () => useContext(CoproContext);
