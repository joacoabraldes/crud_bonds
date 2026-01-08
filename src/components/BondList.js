import React, { useState } from 'react';
import CashflowUploader from './CashflowUploader';

export default function BondList({ bonds, onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showCashflows, setShowCashflows] = useState({});

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCashflows = (id) => {
    setShowCashflows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="accordion-container">
      {bonds.map(b => (
        <div key={b.id} className="accordion-item">
          <button 
            className="accordion-header"
            onClick={() => toggleAccordion(b.id)}
          >
            <span className="accordion-toggle">{expandedId === b.id ? '▼' : '▶'}</span>
            <strong>{b.ticker}</strong> - {b.name || 'N/A'}
          </button>

          {expandedId === b.id && (
            <div className="accordion-content">
              <div className="bond-details">
                <p><strong>Name:</strong> {b.name || 'N/A'}</p>
                <p><strong>Issue Date:</strong> {b.issue_date}</p>
                <p><strong>Maturity:</strong> {b.maturity}</p>
                <p><strong>Coupon:</strong> {b.coupon}</p>
                <p><strong>Index Code:</strong> {b.index_code || 'None'}</p>
                <p><strong>Offset Days:</strong> {b.offset_days}</p>
                <p><strong>Day Count Conv:</strong> {b.day_count_conv}</p>
              </div>

              <div className="accordion-actions">
                <button 
                  className="btn"
                  onClick={() => toggleCashflows(b.id)}
                >
                  {showCashflows[b.id] ? '▼ Hide' : '▶ Show'} Cashflows
                </button>
                <button className="btn btn-secondary" onClick={() => onEdit(b)}>Edit Bond</button>
                <button className="btn btn-danger" onClick={() => onDelete(b.id)}>Delete Bond</button>
              </div>

              {showCashflows[b.id] && (
                <div className="cashflows-section">
                  <CashflowUploader bond={b} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
