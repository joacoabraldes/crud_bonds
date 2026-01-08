import React from 'react';

export default function BondList({ bonds, onEdit, onDelete, onSelect }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>ID</th><th>Ticker</th><th>Name</th><th>Issue</th><th>Maturity</th><th>Coupon</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {bonds.map(b => (
          <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
            <td>{b.id}</td>
            <td>{b.ticker}</td>
            <td>{b.name}</td>
            <td>{b.issue_date}</td>
            <td>{b.maturity}</td>
            <td>{b.coupon}</td>
            <td>
              <button onClick={() => onSelect(b)}>Cashflows</button>{' '}
              <button onClick={() => onEdit(b)}>Edit</button>{' '}
              <button onClick={() => onDelete(b.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
