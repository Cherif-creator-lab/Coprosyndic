import React, { useState } from 'react';
import { useCopro } from '../context/CoproContext';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';

export default function ClientManagement() {
  const { data, addClient, editClient, deleteClient } = useCopro();
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  
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

  return (
    <div>
      <div className="page-header">
        <h1>Gérer les Clients</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <UserPlus size={18} /> Nouveau Client
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
             <h3 style={{margin: 0}}>{editingClientId ? 'Modifier le Client' : 'Affecter un Client'}</h3>
             <button className="btn btn-outline" onClick={resetForm} style={{padding: '0.4rem 0.8rem'}}>Annuler</button>
          </div>
          <form onSubmit={handleSubmit} style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <div className="input-group" style={{flex: '1', minWidth: '200px'}}>
              <label className="input-label">Nom et Prénom</label>
              <input type="text" className="input-field" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="input-group" style={{flex: '1', minWidth: '150px'}}>
              <label className="input-label">CIN (Optionnel)</label>
              <input type="text" className="input-field" value={cin} onChange={e => setCin(e.target.value)} />
            </div>

            <div className="input-group" style={{flex: '1', minWidth: '150px'}}>
              <label className="input-label">Téléphone</label>
              <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            
            <div className="input-group" style={{flex: '1', minWidth: '200px'}}>
              <label className="input-label">Immeuble / Résidence</label>
              <select className="input-field" required value={residenceId} onChange={e => setResidenceId(e.target.value)}>
                <option value="">Sélectionnez une résidence...</option>
                {(data.residences || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div className="input-group" style={{flex: '1', minWidth: '100px'}}>
              <label className="input-label">Étage</label>
              <input type="text" className="input-field" required value={floor} onChange={e => setFloor(e.target.value)} />
            </div>

            <div className="input-group" style={{flex: '1', minWidth: '100px'}}>
              <label className="input-label">Num Appt</label>
              <input type="text" className="input-field" required value={aptNumber} onChange={e => setAptNumber(e.target.value)} />
            </div>

            <div style={{display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem', width: '100%', justifyContent: 'flex-end'}}>
              <button type="submit" className="btn btn-primary">{editingClientId ? 'Sauvegarder les modifications' : 'Ajouter le client'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
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
            {(data.clients || []).map(c => {
               const res = (data.residences || []).find(r => r.id === c.residenceId);
               return (
                 <tr key={c.id}>
                   <td><strong>{c.name}</strong></td>
                   <td>
                     {c.cin && <div style={{fontSize: '0.85em', color: 'var(--color-gold)'}}>CIN: {c.cin}</div>}
                     {c.phone ? <div>{c.phone}</div> : <div style={{color: 'var(--text-secondary)'}}>Pas de Tél</div>}
                   </td>
                   <td>{res ? res.name : 'Inconnue ('+c.residenceId+')'}</td>
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
            {(!data.clients || data.clients.length === 0) && (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Aucun client assigné pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
