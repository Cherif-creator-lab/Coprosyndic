import fs from 'fs';

// 1. Update CoproContext.jsx
const contextPath = './src/context/CoproContext.jsx';
let contextCode = fs.readFileSync(contextPath, 'utf8');

const addEditFunction = `
  const addResidence = async (residence) => {
    try {
      const [newRes] = await sql\`
        INSERT INTO residences (name, address, titre_foncier, apartments, cotisation, years)
        VALUES (\${residence.name}, \${residence.address}, \${residence.titreFoncier},
                \${parseInt(residence.apartments) || 0}, \${parseInt(residence.cotisation) || 300}, \${[2025]})
        RETURNING *
      \`;
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

  const editResidence = async (id, updatedResidence) => {
    try {
      const [updated] = await sql\`
        UPDATE residences SET
          name = \${updatedResidence.name},
          address = \${updatedResidence.address},
          titre_foncier = \${updatedResidence.titreFoncier},
          apartments = \${parseInt(updatedResidence.apartments) || 0},
          cotisation = \${parseInt(updatedResidence.cotisation) || 300}
        WHERE id = \${id}
        RETURNING *
      \`;
      if (updated) {
        const mapped = {
          id: updated.id, name: updated.name, address: updated.address,
          titreFoncier: updated.titre_foncier, apartments: updated.apartments,
          cotisation: updated.cotisation, years: updated.years || [2025]
        };
        setData(prev => ({
          ...prev,
          residences: prev.residences.map(r => r.id === id ? mapped : r)
        }));
      }
    } catch (e) { console.error('editResidence error:', e); }
  };
`;

if (!contextCode.includes('editResidence = async')) {
  contextCode = contextCode.replace(/const addResidence = async[\s\S]*?console\.error\('addResidence error:', e\);\s*};\s*};/m, addEditFunction);
  contextCode = contextCode.replace("addResidence, addClient", "addResidence, editResidence, addClient");
  fs.writeFileSync(contextPath, contextCode, 'utf8');
}

// 2. Update ResidencesList.jsx
const listPath = './src/components/ResidencesList.jsx';
let listCode = fs.readFileSync(listPath, 'utf8');

if (!listCode.includes('Edit2')) {
  listCode = listCode.replace("import { Building2, Plus, FileText, Banknote, Trash2 }", "import { Building2, Plus, FileText, Banknote, Trash2, Edit2 }");
}

if (!listCode.includes('editResidence')) {
  listCode = listCode.replace("const { data, addResidence, deleteResidence } = useCopro();", "const { data, addResidence, editResidence, deleteResidence } = useCopro();");
  
  // Add editing state
  listCode = listCode.replace("const [showForm, setShowForm] = useState(false);", "const [showForm, setShowForm] = useState(false);\n  const [editingId, setEditingId] = useState(null);");

  // Update handleSubmit
  const newHandleSubmit = `const handleSubmit = (e) => {
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
  };`;

  listCode = listCode.replace(/const handleSubmit = \(e\) => {[\s\S]*?};/m, newHandleSubmit);
  
  // Update new residence button to use resetForm
  listCode = listCode.replace("onClick={() => setShowForm(!showForm)}", "onClick={resetForm}");
  
  // Update form title and button
  listCode = listCode.replace("<h3 style={{marginBottom: '1rem'}}>Ajouter une Résidence</h3>", "<h3 style={{marginBottom: '1rem'}}>{editingId ? 'Modifier la Résidence' : 'Ajouter une Résidence'}</h3>");
  listCode = listCode.replace("Enregistrer la résidence", "{editingId ? 'Mettre à jour' : 'Enregistrer la résidence'}");
  
  // Update buttons row
  const buttonRow = `<div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={(e) => { e.preventDefault(); handleEditClick(res); }} title="Modifier la résidence">
                       <Edit2 size={18} />
                    </button>
                    <button className="btn btn-outline" style={{padding: '0.4rem', color: '#e74c3c', borderColor: '#e74c3c'}} onClick={(e) => { e.preventDefault(); deleteResidence(res.id); }} title="Supprimer la résidence">
                       <Trash2 size={18} />
                    </button>
                  </div>`;
  listCode = listCode.replace(/<button className="btn btn-outline" style={{padding: '0\.4rem', color: '#e74c3c'.*?>[\s\S]*?<\/button>/m, buttonRow);

  fs.writeFileSync(listPath, listCode, 'utf8');
}

console.log('Edit feature added!');
