import React, { useState, useEffect } from 'react';
import { getCashflows, createCashflow } from '../api';

export default function CashflowUploader({ bond }) {
  const [cashflows, setCashflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [lastSeq, setLastSeq] = useState(0);
  const [lastResidual, setLastResidual] = useState(100);

  // Form state
  const [seq, setSeq] = useState('');
  const [date, setDate] = useState('');
  const [rate, setRate] = useState('');
  const [amort, setAmort] = useState('');
  const [residual, setResidual] = useState('');
  const [amount, setAmount] = useState('');

  async function load() {
    if (!bond) return;
    setLoading(true);
    try {
      const rows = await getCashflows(bond.id);
      setCashflows(rows);
      if (rows.length > 0) {
        const last = rows[rows.length - 1];
        setLastSeq(last.seq);
        setLastResidual(last.residual);
      } else {
        setLastSeq(0);
        setLastResidual(100);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load cashflows');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [bond]);

  useEffect(() => {
    // Update form when last changes
    const newSeq = lastSeq + 1;
    setSeq(newSeq.toString());
  }, [lastSeq]);

  useEffect(() => {
    // Calculate residual when amort changes
    const a = parseFloat(amort) || 0;
    const newRes = lastResidual - a;
    setResidual(newRes.toString());
  }, [amort, lastResidual]);

  async function onAdd(e) {
    e.preventDefault();
    const s = parseInt(seq);
    if (s !== lastSeq + 1) {
      alert(`Seq must be ${lastSeq + 1}`);
      return;
    }
    const data = {
      seq: s,
      date,
      rate: parseFloat(rate),
      amort: parseFloat(amort),
      residual: parseFloat(residual),
      amount: parseFloat(amount)
    };
    try {
      await createCashflow(bond.id, data);
      load();
      // Reset form
      setDate('');
      setRate('');
      setAmort('');
      setAmount('');
    } catch (err) {
      console.error(err);
      alert('Add failed: ' + err.message);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Cashflows for bond: {bond ? bond.ticker : '—'}</h3>
      {!bond && <div>Select a bond to manage cashflows.</div>}
      {bond && (
        <>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setShowTable(!showTable)}>{showTable ? 'Hide' : 'Show'} Cashflows</button>
          </div>
          {showTable && (
            loading ? <div className="loading">Loading...</div> : (
              <table className="table">
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
            )
          )}
          <h4>Add Cashflow</h4>
          <form onSubmit={onAdd}>
            <div className="form-group">
              <label>Seq</label>
              <input type="number" value={seq} readOnly />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Rate (0-1)</label>
              <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Amort</label>
              <input type="number" step="0.01" value={amort} onChange={e => setAmort(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Residual</label>
              <input type="number" step="0.01" value={residual} readOnly />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-success">Add Cashflow</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
