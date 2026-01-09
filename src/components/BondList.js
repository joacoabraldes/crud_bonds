import React, { useState } from 'react';
import CashflowUploader from './CashflowUploader';

export default function BondList({ bonds, onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showCashflows, setShowCashflows] = useState({});
  const [searchTicker, setSearchTicker] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCashflows = (id) => {
    setShowCashflows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter bonds by ticker
  const filteredBonds = bonds.filter(b => 
    b.ticker.toLowerCase().includes(searchTicker.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredBonds.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedBonds = filteredBonds.slice(startIdx, endIdx);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTicker]);

  return (
    <div className="bond-list-container">
      {bonds.length > 0 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by ticker..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value)}
            className="search-input"
          />
          <span className="search-count">
            {filteredBonds.length} bond{filteredBonds.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}

      <div className="accordion-container">
        {paginatedBonds.length > 0 ? (
          paginatedBonds.map(b => (
            <div key={b.id} className="accordion-item">
              <button 
                className="accordion-header"
                onClick={() => toggleAccordion(b.id)}
              >
                <span className="accordion-toggle">{expandedId === b.id ? '▼' : '▶'}</span>
                <strong>{b.ticker}</strong>
              </button>

              {expandedId === b.id && (
                <div className="accordion-content">
                  <div className="bond-details">
                    <p><strong>Issue Date:</strong> {typeof b.issue_date === 'string' ? b.issue_date.split('T')[0] : b.issue_date}</p>
                    <p><strong>Maturity:</strong> {typeof b.maturity === 'string' ? b.maturity.split('T')[0] : b.maturity}</p>
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
          ))
        ) : (
          <div className="no-results">No bonds found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          
          <div className="page-info">
            Page <span className="page-number">{currentPage}</span> of <span className="page-number">{totalPages}</span>
          </div>
          
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
