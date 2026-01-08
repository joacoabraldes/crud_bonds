import React, { useState, useEffect } from 'react';
import { getIndexes, getDayCountConventions } from '../api';

export default function BondForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ ticker: '', name: '', issue_date: '', maturity: '', coupon: 0, index_code: null, offset_days: 0, day_count_conv_id: '', ...initial });
  const [indexOptions, setIndexOptions] = useState([]);
  const [conventionOptions, setConventionOptions] = useState([]);

  useEffect(() => setForm({ ...form, ...initial }), [initial]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [indexes, conventions] = await Promise.all([getIndexes(), getDayCountConventions()]);
        setIndexOptions(indexes);
        setConventionOptions(conventions);
      } catch (e) {
        console.error('Failed to load options', e);
      }
    }
    loadOptions();
  }, []);

  function change(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSave({ ...form, coupon: Number(form.coupon), offset_days: Number(form.offset_days) });
  }

  return (
    <div>
      <h2>{initial.id ? 'Edit Bond' : 'New Bond'}</h2>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Ticker</label>
          <input name="ticker" value={form.ticker} onChange={change} required />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={form.name} onChange={change} />
        </div>
        <div className="form-group">
          <label>Issue Date</label>
          <input name="issue_date" type="date" value={form.issue_date} onChange={change} required />
        </div>
        <div className="form-group">
          <label>Maturity</label>
          <input name="maturity" type="date" value={form.maturity} onChange={change} required />
        </div>
        <div className="form-group">
          <label>Coupon (0-1)</label>
          <input name="coupon" type="number" min="0" max="1" step="0.00001" value={form.coupon} onChange={change} />
        </div>
        <div className="form-group">
          <label>Index Code</label>
          <select name="index_code" value={form.index_code || ''} onChange={change}>
            <option value="">None</option>
            {indexOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Offset Days (≤0)</label>
          <input name="offset_days" type="number" max="0" step="1" value={form.offset_days} onChange={change} />
        </div>
        <div className="form-group">
          <label>Day Count Convention</label>
          <select name="day_count_conv_id" value={form.day_count_conv_id} onChange={change} required>
            <option value="">Select Convention</option>
            {conventionOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.code} - {opt.description}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-success">Save</button>{' '}
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
