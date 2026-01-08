require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

const upload = multer(); // for multipart/form-data CSV upload

// Initialize auto-increment sequence for mock_bonds
async function initializeSequence() {
  try {
    // Create sequence if it doesn't exist
    await pool.query('CREATE SEQUENCE IF NOT EXISTS mock_bonds_id_seq');
    
    // Set the default for id column
    await pool.query(`
      ALTER TABLE mock_bonds 
      ALTER COLUMN id SET DEFAULT nextval('mock_bonds_id_seq'::regclass)
    `);
    
    // Sync sequence with max ID
    await pool.query(`
      SELECT setval('mock_bonds_id_seq', COALESCE((SELECT MAX(id) FROM mock_bonds), 0) + 1)
    `);
    
    console.log('✅ Auto-increment sequence initialized for mock_bonds');
  } catch (err) {
    console.warn('⚠️ Warning initializing sequence (may not be critical):', err.message);
  }
}

// Initialize on startup
initializeSequence();

// --- Bonds endpoints ---

// list bonds
app.get('/bonds', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        b.*,
        b."offset" AS offset_days,
        b.day_count_conv AS day_count_conv_id,
        c.convention AS day_count_conv,
        it.code AS index_code,
        it.name AS index_name
      FROM mock_bonds b
      LEFT JOIN mock_day_count_convention c ON b.day_count_conv = c.id
      LEFT JOIN mock_index_types it ON b.index_type_id = it.id
      ORDER BY b.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// get single bond
app.get('/bonds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT
        b.*,
        b."offset" AS offset_days,
        b.day_count_conv AS day_count_conv_id,
        c.convention AS day_count_conv,
        it.code AS index_code,
        it.name AS index_name
      FROM mock_bonds b
      LEFT JOIN mock_day_count_convention c ON b.day_count_conv = c.id
      LEFT JOIN mock_index_types it ON b.index_type_id = it.id
      WHERE b.id = $1
    `, [id]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// create bond
app.post('/bonds', async (req, res) => {
  // frontend may send: ticker, name, issue_date, maturity, coupon, index_code, offset_days, day_count_conv_id, active
  const { ticker, issue_date, maturity, coupon, index_code, offset_days, day_count_conv_id, active } = req.body;
  try {
    // resolve index_type_id from index_code if provided
    let index_type_id = null;
    if (index_code) {
      const r = await pool.query('SELECT id FROM mock_index_types WHERE code = $1 LIMIT 1', [index_code]);
      if (r.rows[0]) index_type_id = r.rows[0].id;
    }

    const q = `INSERT INTO mock_bonds
      (ticker, issue_date, maturity, coupon, index_type_id, "offset", day_count_conv, active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())
      RETURNING id, ticker, issue_date, maturity, coupon, index_type_id, "offset" AS offset_days, day_count_conv AS day_count_conv_id, active, created_at, updated_at`;
    const { rows } = await pool.query(q, [ticker, issue_date, maturity, coupon, index_type_id, offset_days, day_count_conv_id, active !== undefined ? active : true]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// update bond
app.put('/bonds/:id', async (req, res) => {
  const { id } = req.params;
  const { ticker, issue_date, maturity, coupon, index_code, offset_days, day_count_conv_id, active } = req.body;
  try {
    // resolve index_type_id if index_code provided
    let index_type_id = null;
    if (index_code) {
      const r = await pool.query('SELECT id FROM mock_index_types WHERE code = $1 LIMIT 1', [index_code]);
      if (r.rows[0]) index_type_id = r.rows[0].id;
    }

    const q = `UPDATE mock_bonds SET
                 ticker=$1, issue_date=$2, maturity=$3, coupon=$4,
                 index_type_id=$5, "offset"=$6, day_count_conv=$7, active=$8, updated_at=now()
               WHERE id=$9
               RETURNING id, ticker, issue_date, maturity, coupon, index_type_id, "offset" AS offset_days, day_count_conv AS day_count_conv_id, active, created_at, updated_at`;
    const { rows } = await pool.query(q, [ticker, issue_date, maturity, coupon, index_type_id, offset_days, day_count_conv_id, active !== undefined ? active : true, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bond not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// delete bond
app.delete('/bonds/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM mock_bonds WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bond not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// --- Cashflows ---
// get cashflows for bond
app.get('/bonds/:id/cashflows', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT id, bond_id, seq, "date", rate, amort, residual, amount, created_at FROM mock_bond_cashflows WHERE bond_id = $1 ORDER BY seq', [id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// add a single cashflow
app.post('/bonds/:id/cashflows', async (req, res) => {
  const bond_id = req.params.id;
  const { seq, date, rate, amort, residual, amount } = req.body;
  try {
    const q = `INSERT INTO mock_bond_cashflows (bond_id, seq, "date", rate, amort, residual, amount, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7, now()) RETURNING *`;
    const { rows } = await pool.query(q, [bond_id, seq, date, rate, amort, residual, amount]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// bulk upload via JSON array (Accepts array of objects)
app.post('/bonds/:id/cashflows/bulk-json', async (req, res) => {
  const bond_id = req.params.id;
  const rows = req.body; // expect [{seq,date,rate,amort,residual,amount}, ...]
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'expected array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const values = [];
    const placeholders = [];
    let idx = 1;
    for (const r of rows) {
      placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      values.push(bond_id, r.seq, r.date, r.rate, r.amort, r.residual, r.amount);
    }
    if (placeholders.length > 0) {
      const sql = `INSERT INTO mock_bond_cashflows (bond_id, seq, "date", rate, amort, residual, amount) VALUES ${placeholders.join(',')}`;
      await client.query(sql, values);
    }
    await client.query('COMMIT');
    res.json({ inserted: rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

//  Indexes 
app.get('/indexes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT code FROM mock_index_types ORDER BY code');
    res.json(rows.map(r => r.code));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Day Count Conventions 
app.get('/day-count-conventions', async (req, res) => {
  try {
    // return shape { id, code, description } for compatibility with frontend
    const { rows } = await pool.query('SELECT id, convention FROM mock_day_count_convention ORDER BY convention');
    const mapped = rows.map(r => ({ id: r.id, code: r.convention, description: null }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
