import fs from 'fs';

// 1. Update CoproContext.jsx
const contextPath = './src/context/CoproContext.jsx';
let contextCode = fs.readFileSync(contextPath, 'utf8');

const addDeleteFunction = `
  const deleteClient = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    try {
      await sql\`DELETE FROM clients WHERE id = \${id}\`;
      setData(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
    } catch (e) { console.error('deleteClient error:', e); }
  };

  const deleteResidence = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette résidence et TOUTES ses données (clients, paiements) ?')) return;
    try {
      await sql\`DELETE FROM residences WHERE id = \${id}\`;
      setData(prev => {
        const newPayments = { ...prev.payments };
        delete newPayments[id];
        return {
          ...prev,
          residences: prev.residences.filter(r => r.id !== id),
          clients: prev.clients.filter(c => c.residenceId !== id),
          payments: newPayments
        };
      });
    } catch (e) { console.error('deleteResidence error:', e); }
  };
`;

contextCode = contextCode.replace(/const deleteClient = async[\s\S]*?console\.error\('deleteClient error:', e\);\s*};\s*};/m, addDeleteFunction);

// Manual replace fallback if regex didn't match
if (!contextCode.includes('deleteResidence = async')) {
  contextCode = contextCode.replace("const togglePayment = async", "  const deleteResidence = async (id) => {\n    if (!window.confirm('Voulez-vous vraiment supprimer cette résidence et TOUTES ses données (clients, paiements) ?')) return;\n    try {\n      await sql`DELETE FROM residences WHERE id = ${id}`;\n      setData(prev => {\n        const newPayments = { ...prev.payments };\n        delete newPayments[id];\n        return {\n          ...prev,\n          residences: prev.residences.filter(r => r.id !== id),\n          clients: prev.clients.filter(c => c.residenceId !== id),\n          payments: newPayments\n        };\n      });\n    } catch (e) { console.error('deleteResidence error:', e); }\n  };\n\n  const togglePayment = async");
}

contextCode = contextCode.replace("deleteClient, addYearToResidence", "deleteClient, deleteResidence, addYearToResidence");

fs.writeFileSync(contextPath, contextCode, 'utf8');

// 2. Update ResidencesList.jsx
const listPath = './src/components/ResidencesList.jsx';
let listCode = fs.readFileSync(listPath, 'utf8');

if (!listCode.includes('Trash2')) {
  listCode = listCode.replace("import { Building2, Plus, FileText, Banknote } from 'lucide-react';", "import { Building2, Plus, FileText, Banknote, Trash2 } from 'lucide-react';");
}
if (!listCode.includes('deleteResidence')) {
  listCode = listCode.replace("const { data, addResidence } = useCopro();", "const { data, addResidence, deleteResidence } = useCopro();");
  listCode = listCode.replace(
    "<h3 style={{margin: 0}}>{res.name}</h3>", 
    `<div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                  <h3 style={{margin: 0}}>{res.name}</h3>
                  <button className="btn btn-outline" style={{padding: '0.4rem', color: '#e74c3c', borderColor: '#e74c3c'}} onClick={(e) => { e.preventDefault(); deleteResidence(res.id); }} title="Supprimer la résidence">
                     <Trash2 size={18} />
                  </button>
               </div>`
  );
}

fs.writeFileSync(listPath, listCode, 'utf8');
console.log('Update successful!');
