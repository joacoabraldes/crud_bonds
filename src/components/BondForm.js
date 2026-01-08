import React, { useState, useEffect } from 'react';

export default function BondForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ ticker: '', name: '', issue_date: '', maturity: '', coupon: 0, index_code: null, offset_days: 0, day_count_conv: '', ...initial });

  useEffect(() => setForm({ ...form, ...initial }), [initial]); // keep simple

  function change(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSave({ ...form, coupon: Number(form.coupon), offset_days: Number(form.offset_days) });
  }

  return (
    <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
      <div><label>Ticker <input name="ticker" value={form.ticker} onChange={change} required /></label></div>
      <div><label>Name <input name="name" value={form.name} onChange={change} /></label></div>
      <div><label>Issue date <input name="issue_date" type="date" value={form.issue_date} onChange={change} required /></label></div>
      <div><label>Maturity <input name="maturity" type="date" value={form.maturity} onChange={change} required /></label></div>
      <div><label>Coupon <input name="coupon" type="number" min="0" max="1"step="0.00001" value={form.coupon} onChange={change} /></label></div>
      <div><label>Index code <input name="index_code" value={form.index_code || ''} onChange={change} /></label></div>
      <div><label>Offset days  <input name="offset_days" type="number" max="0" step="1" value={form.offset_days} onChange={change} /></label></div>
      <div><label>Day count conv <input name="day_count_conv" value={form.day_count_conv} onChange={change} /></label></div>
      <div style={{ marginTop: 8 }}>
        <button type="submit">Save</button>{' '}
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
