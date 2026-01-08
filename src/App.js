import React, { useEffect, useState } from 'react';
import { getBonds, createBond, updateBond, deleteBond } from './api';
import BondList from './components/BondList';
import BondForm from './components/BondForm';
import CashflowUploader from './components/CashflowUploader';

function App() {
  const [bonds, setBonds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedBond, setSelectedBond] = useState(null);

  async function load() {
    try {
      const rows = await getBonds();
      setBonds(rows);
    } catch (e) {
      console.error(e);
      alert('Failed to load bonds');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(bond) {
    try {
      if (bond.id) {
        await updateBond(bond.id, bond);
      } else {
        await createBond(bond);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      alert('Save failed: ' + e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete bond?')) return;
    try {
      await deleteBond(id);
      load();
      if (selectedBond && selectedBond.id === id) setSelectedBond(null);
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>CRUD Bonds</h1>
        <div>
          <button onClick={() => { setEditing({}); setShowForm(true); }}>+ New Bond</button>
        </div>
      </header>

      <main>
        <section style={{ marginTop: 12 }}>
          <BondList
            bonds={bonds}
            onEdit={(b) => { setEditing(b); setShowForm(true); }}
            onDelete={handleDelete}
            onSelect={(b) => setSelectedBond(b)}
          />
        </section>

        {showForm && (
          <section style={{ marginTop: 12 }}>
            <BondForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
          </section>
        )}

        <section style={{ marginTop: 24 }}>
          <CashflowUploader bond={selectedBond} />
        </section>
      </main>
    </div>
  );
}

export default App;
