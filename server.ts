import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = "13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE";

// Initialize SQLite database
const dbPath = path.join(__dirname, 'hr_dashboard.db');
const db = new Database(dbPath);

// Create users table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Initialize default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', defaultPassword);
  console.log('Default admin user created: username=admin, password=admin123');
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = Number(process.env.PORT) || 8000;

  // Login endpoint
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username } 
    });
  });

  // Proxy Google Sheets CSV (avoids browser CORS on gviz/sheet-name URLs)
  app.get('/api/sheet-csv', async (req, res) => {
    const sheet = typeof req.query.sheet === 'string' ? req.query.sheet : '';
    const gid = typeof req.query.gid === 'string' ? req.query.gid : '';

    if (!sheet && !gid) {
      return res.status(400).json({ error: 'sheet or gid query parameter required' });
    }

    const url = gid
      ? `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${encodeURIComponent(gid)}`
      : `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Google Sheets returned ${response.status}` });
      }
      const csv = await response.text();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send(csv);
    } catch (error) {
      console.error('Sheet proxy error:', error);
      res.status(502).json({ error: 'Failed to fetch sheet data' });
    }
  });

  // Change password endpoint
  app.post('/api/change-password', (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedNewPassword, username);
    
    res.json({ success: true });
  });

  console.log('NODE_ENV:', process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") {
    console.log('Running in DEVELOPMENT mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode with static files');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
