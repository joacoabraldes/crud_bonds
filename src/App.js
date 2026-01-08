import React, { useEffect, useState } from 'react';
import { getBonds, createBond, updateBond, deleteBond } from './api';
import BondList from './components/BondList';
import BondForm from './components/BondForm';
import './style.css';

function App() {
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await getBonds();
      setBonds(rows);
    } catch (e) {
      console.error(e);
      alert('Failed to load bonds');
    } finally {
      setLoading(false);
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
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>CRUD Bonds</h1>
        <div>
          <button className="btn btn-success" onClick={() => { setEditing({}); setShowForm(true); }}>+ New Bond</button>
        </div>
      </header>

      <main>
        <section>
          {loading ? <div className="loading">Loading bonds...</div> : (
            <BondList
              bonds={bonds}
              onEdit={(b) => { setEditing(b); setShowForm(true); }}
              onDelete={handleDelete}
            />
          )}
        </section>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <BondForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
