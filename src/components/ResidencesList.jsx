import React, { useState } from 'react';
import { useCopro } from '../context/CoproContext';
import { Link } from 'react-router-dom';
import { Building2, Plus, FileText, Banknote, Trash2, Edit2 } from 'lucide-react';

export default function ResidencesList() {
  const { data, addResidence, editResidence, deleteResidence } = useCopro();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [titreFoncier, setTitreFoncier] = useState('');
  const [apartments, setApartments] = useState(20);
  const [cotisation, setCotisation] = useState(300);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(name.trim() !== '') {
       if (editingId) {
         editResidence(editingId, { name, address, titreFoncier, apartments: Number(apartments), cotisation: Number(cotisation) });
       } else {
         addResidence({ name, address, titreFoncier, apartments: Number(apartments), cotisation: Number(cotisation) });
       }
       setName(''); setAddress(''); setTitreFoncier(''); setApartments(20); setCotisation(300);
       setEditingId(null);
       setShowForm(false);
    }
  };

  const handleEditClick = (res) => {
    setName(res.name);
    setAddress(res.address);
    setTitreFoncier(res.titreFoncier);
    setApartments(res.apartments);
    setCotisation(res.cotisation);
    setEditingId(res.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const resetForm = () => {
    setName(''); setAddress(''); setTitreFoncier(''); setApartments(20); setCotisation(300);
    setEditingId(null);
    setShowForm(!showForm);
  };

  return (
    <div>
      <div className="page-header" style={{flexWrap: 'wrap', gap: '0.75rem'}}>
        <h1>Gérer les Résidences</h1>
        <button className="btn btn-primary" onClick={resetForm}>
          <Plus size={18} /> Nouvelle Résidence
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>{editingId ? 'Modifier la Résidence' : 'Ajouter une Résidence'}</h3>
          <form onSubmit={handleSubmit} style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <div className="input-group" style={{flex: '1', minWidth: '200px'}}>
              <label className="input-label">Nom de la Résidence</label>
              <input type="text" className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Adam 168" />
            </div>
            <div className="input-group" style={{flex: '1', minWidth: '200px'}}>
              <label className="input-label">Adresse</label>
              <input type="text" className="input-field" required value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse de la résidence" />
            </div>
            <div className="input-group" style={{flex: '1', minWidth: '150px'}}>
              <label className="input-label">Titre Foncier</label>
              <input type="text" className="input-field" required value={titreFoncier} onChange={e => setTitreFoncier(e.target.value)} placeholder="Ex: 5412/12" />
            </div>
            <div className="input-group" style={{flex: '1', minWidth: '150px'}}>
              <label className="input-label">Nb d'Appartements</label>
              <input type="number" className="input-field" required value={apartments} onChange={e => setApartments(e.target.value)} min="1" />
            </div>
            <div className="input-group" style={{flex: '1', minWidth: '150px'}}>
              <label className="input-label">Cotisation mensuelle (DH)</label>
              <input type="number" className="input-field" required value={cotisation} onChange={e => setCotisation(e.target.value)} min="0" step="0.01" />
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem', width: '100%', justifyContent: 'flex-end'}}>
              <button type="submit" className="btn btn-primary">{editingId ? 'Mettre à jour' : 'Enregistrer la résidence'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        {(data.residences || []).map(res => (
          <div key={res.id} className="card" style={{borderTop: '4px solid var(--color-gold)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem'}}>
               <Building2 size={24} color="var(--color-gold)" />
               <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                  <h3 style={{margin: 0}}>{res.name}</h3>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={(e) => { e.preventDefault(); handleEditClick(res); }} title="Modifier la résidence">
                       <Edit2 size={18} />
                    </button>
                    <button className="btn btn-outline" style={{padding: '0.4rem', color: '#e74c3c', borderColor: '#e74c3c'}} onClick={(e) => { e.preventDefault(); deleteResidence(res.id); }} title="Supprimer la résidence">
                       <Trash2 size={18} />
                    </button>
                  </div>
               </div>
            </div>
            <div style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
               <p style={{marginBottom: '0.5rem'}}>{res.address}</p>
               <div style={{display: 'flex', gap: '1rem', margin: '0.5rem 0'}}>
                 <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}><FileText size={16}/> Titre : {res.titreFoncier || 'N/A'}</span>
                 <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}><Banknote size={16}/> {res.cotisation || 300} DH / mois</span>
               </div>
               <p><strong>{res.apartments}</strong> appartements au total</p>
            </div>
            
            <Link to={`/residence/${res.id}`} className="btn btn-outline" style={{width: '100%', textDecoration: 'none'}}>
               Ouvrir la Matrice de Paiement
            </Link>
          </div>
        ))}
        {(!data.residences || data.residences.length === 0) && (
          <p style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem'}}>Aucune résidence ajoutée.</p>
        )}
      </div>
    </div>
  );
}
