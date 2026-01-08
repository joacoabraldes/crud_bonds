import React, { useState, useEffect } from 'react';
import { getCashflows, uploadCashflowsCsv, uploadCashflowsJson, createCashflow } from '../api';

export default function CashflowUploader({ bond }) {
  const [file, setFile] = useState(null);
  const [cashflows, setCashflows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!bond) return;
    setLoading(true);
    try {
      const rows = await getCashflows(bond.id);
      setCashflows(rows);
    } catch (e) {
      console.error(e);
      alert('Failed to load cashflows');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [bond]);

  async function onUploadCsv(e) {
    e.preventDefault();
    if (!file || !bond) return alert('Select bond and file');
    try {
      const r = await uploadCashflowsCsv(bond.id, file);
      alert(`Inserted ${r.inserted} rows`);
      load();
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    }
  }

  async function onAddRow() {
    const seq = prompt('seq (integer)');
    const date = prompt('date (YYYY-MM-DD)');
    const rate = prompt('rate (0..1)');
    const amort = prompt('amort');
    const residual = prompt('residual');
    const amount = prompt('amount');
    if (!seq) return;
    try {
      await createCashflow(bond.id, { seq, date, rate, amort, residual, amount });
      load();
    } catch (err) {
      console.error(err);
      alert('Add failed');
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Cashflows for bond: {bond ? bond.ticker : '—'}</h3>
      {!bond && <div>Select a bond to manage cashflows.</div>}
      {bond && (
        <>
          <div style={{ marginBottom: 8 }}>
            <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files[0])} />
            <button onClick={onUploadCsv} disabled={!file}>Upload CSV</button>{' '}
            <button onClick={onAddRow}>Add single cashflow</button>
          </div>

          {loading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>seq</th><th>date</th><th>rate</th><th>amort</th><th>residual</th><th>amount</th>
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.seq}><td>{c.seq}</td><td>{c.date}</td><td>{c.rate}</td><td>{c.amort}</td><td>{c.residual}</td><td>{c.amount}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
