import React, { useState } from 'react';
import { useCopro } from '../context/CoproContext';
import { UserPlus, Edit2, Trash2, Phone, Home, Building2, CreditCard, User } from 'lucide-react';

export default function ClientManagement() {
  const { data, addClient, editClient, deleteClient } = useCopro();
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [filterRes, setFilterRes] = useState('');
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cin, setCin] = useState('');
  const [floor, setFloor] = useState('');
  const [residenceId, setResidenceId] = useState('');
  const [aptNumber, setAptNumber] = useState('');

  const resetForm = () => {
     setName(''); setPhone(''); setCin(''); setFloor(''); setAptNumber(''); setResidenceId('');
     setEditingClientId(null);
     setShowForm(false);
  };

  const handleEditClick = (client) => {
     setName(client.name || '');
     setPhone(client.phone || '');
     setCin(client.cin || '');
     setFloor(client.floor || '');
     setResidenceId(client.residenceId || '');
     setAptNumber(client.aptNumber || '');
     setEditingClientId(client.id);
     setShowForm(true);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(name && residenceId && aptNumber) {
       if (editingClientId) {
          editClient(editingClientId, { name, phone, cin, floor, residenceId, aptNumber });
       } else {
          addClient({ name, phone, cin, floor, residenceId, aptNumber });
       }
       resetForm();
    }
  };

  const filteredClients = (data.clients || []).filter(c => {
    const matchRes = filterRes ? c.residenceId === filterRes : true;
    const matchSearch = search ? (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.aptNumber || '').includes(search) : true;
    return matchRes && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{flexWrap: 'wrap', gap: '0.75rem'}}>
        <h1 style={{fontSize: 'clamp(1.2rem, 5vw, 2rem)'}}>Gérer les Clients</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <UserPlus size={18} /> Nouveau Client
        </button>
      </div>

      {/* Search + Filter bar */}
      <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem'}}>
        <input
          type="text"
          className="input-field"
          placeholder="Rechercher par nom ou apt..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{flex: '1', minWidth: '150px', fontSize: '16px'}}
        />
        <select
          className="input-field"
          value={filterRes}
          onChange={e => setFilterRes(e.target.value)}
          style={{flex: '1', minWidth: '130px', fontSize: '16px'}}
        >
          <option value="">Toutes les résidences</option>
          {(data.residences || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
             <h3 style={{margin: 0, fontSize: 'clamp(1rem, 4vw, 1.3rem)'}}>{editingClientId ? 'Modifier le Client' : 'Affecter un Client'}</h3>
             <button className="btn btn-outline" onClick={resetForm} style={{padding: '0.4rem 0.8rem'}}>Annuler</button>
          </div>
          <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem'}}>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">Nom et Prénom *</label>
              <input type="text" className="input-field" required value={name} onChange={e => setName(e.target.value)} style={{fontSize: '16px'}} />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">CIN (Optionnel)</label>
              <input type="text" className="input-field" value={cin} onChange={e => setCin(e.target.value)} style={{fontSize: '16px'}} />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">Téléphone</label>
              <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} style={{fontSize: '16px'}} />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">Résidence *</label>
              <select className="input-field" required value={residenceId} onChange={e => setResidenceId(e.target.value)} style={{fontSize: '16px'}}>
                <option value="">Sélectionner...</option>
                {(data.residences || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">Étage *</label>
              <input type="text" className="input-field" required value={floor} onChange={e => setFloor(e.target.value)} style={{fontSize: '16px'}} />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label">Num Appt *</label>
              <input type="text" className="input-field" required value={aptNumber} onChange={e => setAptNumber(e.target.value)} style={{fontSize: '16px'}} />
            </div>
            <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem'}}>
              <button type="submit" className="btn btn-primary" style={{width: '100%', maxWidth: '300px'}}>
                {editingClientId ? 'Sauvegarder' : 'Ajouter le client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Counter */}
      <p style={{color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.85rem'}}>
        {filteredClients.length} client(s) trouvé(s)
      </p>

      {/* MOBILE: Cards list */}
      <div className="client-cards-mobile" style={{display: 'none'}}>
        {filteredClients.map(c => {
          const res = (data.residences || []).find(r => r.id === c.residenceId);
          return (
            <div key={c.id} className="card" style={{marginBottom: '0.75rem', borderLeft: '3px solid var(--color-gold)', padding: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem'}}>
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)'}}>{c.name}</div>
                  <div style={{fontSize: '0.8rem', color: 'var(--color-gold)', marginTop: '2px'}}>Apt #{c.aptNumber} — Étage {c.floor || '?'}</div>
                </div>
                <div style={{display: 'flex', gap: '0.4rem', flexShrink: 0}}>
                  <button className="btn btn-outline" style={{padding: '0.35rem 0.5rem'}} onClick={() => handleEditClick(c)}>
                    <Edit2 size={15} />
                  </button>
                  <button className="btn btn-outline" style={{padding: '0.35rem 0.5rem', color: '#e74c3c', borderColor: '#e74c3c'}} onClick={() => deleteClient(c.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                {res && (
                  <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                    <Building2 size={13} /> {res.name}
                  </span>
                )}
                {c.phone && (
                  <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                    <Phone size={13} /> {c.phone}
                  </span>
                )}
                {c.cin && (
                  <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                    <CreditCard size={13} /> {c.cin}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className="card" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
            Aucun client trouvé.
          </div>
        )}
      </div>

      {/* DESKTOP: Table */}
      <div className="client-table-desktop table-container">
        <table>
          <thead>
            <tr>
              <th>Client / Copropriétaire</th>
              <th>CIN / Contact</th>
              <th>Résidence Associée</th>
              <th>Étage</th>
              <th>Appartement</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(c => {
               const res = (data.residences || []).find(r => r.id === c.residenceId);
               return (
                 <tr key={c.id}>
                   <td><strong>{c.name}</strong></td>
                   <td>
                     {c.cin && <div style={{fontSize: '0.85em', color: 'var(--color-gold)'}}>CIN: {c.cin}</div>}
                     {c.phone ? <div>{c.phone}</div> : <div style={{color: 'var(--text-secondary)'}}>Pas de Tél</div>}
                   </td>
                   <td>{res ? res.name : 'Inconnue'}</td>
                   <td>{c.floor || '-'}</td>
                   <td><strong>Apt #{c.aptNumber}</strong></td>
                   <td>
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                         <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => handleEditClick(c)} title="Modifier">
                            <Edit2 size={16} />
                         </button>
                         <button className="btn btn-outline" style={{padding: '0.4rem', color: '#e74c3c', borderColor: '#e74c3c'}} onClick={() => deleteClient(c.id)} title="Supprimer">
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </td>
                 </tr>
               );
            })}
            {filteredClients.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Aucun client trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CSS to switch between cards and table */}
      <style>{`
        @media (max-width: 768px) {
          .client-cards-mobile { display: block !important; }
          .client-table-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
