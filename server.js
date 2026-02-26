const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: process.env.DB_HOST,
  database: 'postgres',
  password: process.env.DB_PASS,
  port: 5432,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.log("DB init error (waiting for db to be ready):", err.message));

app.get('/api/visitors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitors ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visitors', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO visitors (name) VALUES ($1)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple UI (served on the root route)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>KSM Docker Demo</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 40px; }
        .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-top: 5px solid #005696; }
        h1 { color: #005696; }
        input, button { padding: 10px; font-size: 16px; margin-top: 10px; }
        button { background-color: #005696; color: white; border: none; cursor: pointer; }
        ul { list-style-type: none; padding: 0; }
        li { background: #eef2f5; margin: 5px 0; padding: 10px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐳 Docker Compose Demo</h1>
        <p>Connected to PostgreSQL container named: <strong>db</strong></p>
        <input type="text" id="name" placeholder="Enter your name" />
        <button onclick="addVisitor()">Sign the Log</button>
        <ul id="list"></ul>
      </div>
      <script>
        async function load() {
          const res = await fetch('/api/visitors');
          const data = await res.json();
          document.getElementById('list').innerHTML = data.map(v => '<li>👤 <b>' + v.name + '</b> - ' + new Date(v.timestamp).toLocaleTimeString() + '</li>').join('');
        }
        async function addVisitor() {
          const name = document.getElementById('name').value;
          if(!name) return;
          await fetch('/api/visitors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name}) });
          document.getElementById('name').value = '';
          load();
        }
        load();
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => console.log('App running on http://localhost:3000'));