import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import fs from "fs";

// Fallback JSON-based store or SQLite
interface UserRecord {
  email: string;
  name: string;
  first_name: string;
  password_hash: string;
  is_first_login: number;
  role: string;
  title?: string;
}

const defaultUsers = [
  { name: "Admin", email: "admin@orderofkpi.org", role: "admin", title: "Administrator" },
  { name: "Deshaun Stafford", email: "deshaun.stafford@orderofkpi.org", role: "member" },
  { name: "Brian Johnson", email: "brian.johnson@orderofkpi.org", role: "officer", title: "Grammateus" },
  { name: "Ishmeal Allensworth", email: "ishmeal.allensworth@orderofkpi.org", role: "officer", title: "Tamiouchos" },
  { name: "Edward Cook", email: "edward.cook@orderofkpi.org", role: "officer", title: "Epistoleus" },
  { name: "Darron Jenkins", email: "darron.jenkins@orderofkpi.org", role: "officer", title: "Hodegos" },
  { name: "James Haywood Jr", email: "james.haywood@orderofkpi.org", role: "officer", title: "2nd Anti-Basileus" },
  { name: "Dameone Ferguson", email: "dameone.ferguson@orderofkpi.org", role: "member" },
  { name: "Brian Goings", email: "brian.goings@orderofkpi.org", role: "officer", title: "Basileus" },
  { name: "Keith Woods", email: "keith.woods@orderofkpi.org", role: "member" },
  { name: "Dominic Goodman", email: "dominic.goodman@orderofkpi.org", role: "member" },
  { name: "Jason Pilar", email: "jason.pilar@orderofkpi.org", role: "member" },
  { name: "Brandon Owens", email: "brandon.owens@orderofkpi.org", role: "officer", title: "Historian" },
  { name: "Jack Dee", email: "jack.dee@orderofkpi.org", role: "member" },
  { name: "Anthony Jones", email: "anthony.jones@orderofkpi.org", role: "officer", title: "1st Anti-Basileus" },
  { name: "Donald Mitchell", email: "donald.mitchell@orderofkpi.org", role: "member" },
  { name: "Kameron Whitfield", email: "kameron.whitfield@orderofkpi.org", role: "member" },
  { name: "Tobias Bordley", email: "tobias.bordley@orderofkpi.org", role: "member" },
  { name: "Denzel Talley", email: "denzel.talley@orderofkpi.org", role: "member" }
];

let useSqlite = true;
let sqliteDb: any = null;
const jsonDbPath = path.join(process.cwd(), "kpi_members_v2.json");

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function initDb() {
  const allowedEmails = new Set(defaultUsers.map(u => u.email.toLowerCase().trim()));
  const defaultPasswordHash = hashPassword("2012");

  try {
    // Try importing better-sqlite3 dynamically
    const { default: Database } = await import("better-sqlite3");
    const dbPath = path.join(process.cwd(), "kpi_members_v2.db");
    sqliteDb = new Database(dbPath);
    
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT,
        first_name TEXT,
        password_hash TEXT,
        is_first_login INTEGER DEFAULT 1,
        role TEXT,
        title TEXT
      )
    `);

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN title TEXT");
    } catch (e) {
      // Column already exists
    }
    
    // SQLite Cleanup
    const existingRows = sqliteDb.prepare("SELECT email FROM users").all() as { email: string }[];
    for (const row of existingRows) {
      const emailNorm = row.email.toLowerCase().trim();
      if (!allowedEmails.has(emailNorm)) {
        console.log(`[DB Cleanup] Deleting invalid/inactive user from SQLite: ${emailNorm}`);
        sqliteDb.prepare("DELETE FROM users WHERE email = ?").run(row.email);
      }
    }

    // Add or update users to align with latest roles and titles, preserving existing password hashes
    for (const u of defaultUsers) {
      const emailNorm = u.email.toLowerCase().trim();
      const firstName = u.name.split(" ")[0];
      const existingUser = sqliteDb.prepare("SELECT password_hash FROM users WHERE email = ?").get(emailNorm) as any;
      if (existingUser) {
        sqliteDb.prepare(`
          UPDATE users 
          SET name = ?, first_name = ?, role = ?, title = ? 
          WHERE email = ?
        `).run(u.name, firstName, u.role, u.title || "", emailNorm);
      } else {
        sqliteDb.prepare(`
          INSERT INTO users (email, name, first_name, password_hash, is_first_login, role, title)
          VALUES (?, ?, ?, ?, 1, ?, ?)
        `).run(emailNorm, u.name, firstName, defaultPasswordHash, u.role, u.title || "");
      }
    }
    console.log("SQLite database synchronized with official active roster.");
  } catch (err) {
    console.log("SQLite loading failed, falling back to JSON database file.");
    useSqlite = false;
  }

  // Always ensure JSON database is seeded, synchronized, and available as a safe fallback/primary option
  try {
    let initialData: Record<string, UserRecord> = {};
    if (fs.existsSync(jsonDbPath)) {
      try {
        initialData = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
      } catch (e) {
        console.error("Error reading JSON db, resetting to default roster", e);
      }
    }

    // Filter out invalid users
    const cleanData: Record<string, UserRecord> = {};
    for (const [email, user] of Object.entries(initialData)) {
      const emailNorm = email.toLowerCase().trim();
      if (allowedEmails.has(emailNorm)) {
        cleanData[emailNorm] = user;
      } else {
        console.log(`[DB Cleanup] Deleting invalid/inactive user from JSON DB: ${emailNorm}`);
      }
    }

    // Add missing users or update roles/titles for existing ones
    for (const u of defaultUsers) {
      const emailNorm = u.email.toLowerCase().trim();
      if (!cleanData[emailNorm]) {
        const firstName = u.name.split(" ")[0];
        cleanData[emailNorm] = {
          email: emailNorm,
          name: u.name,
          first_name: firstName,
          password_hash: defaultPasswordHash,
          is_first_login: 1,
          role: u.role,
          title: u.title || ""
        };
      } else {
        cleanData[emailNorm].role = u.role;
        cleanData[emailNorm].title = u.title || "";
      }
    }

    fs.writeFileSync(jsonDbPath, JSON.stringify(cleanData, null, 2));
    console.log("JSON database synchronized with official active roster.");
  } catch (jsonErr) {
    console.error("JSON database sync failed:", jsonErr);
  }
}

// DB Helper functions
function findUser(email: string): UserRecord | null {
  const normEmail = email.toLowerCase().trim();
  if (useSqlite && sqliteDb) {
    try {
      const row = sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(normEmail) as any;
      if (row) {
        return {
          email: row.email,
          name: row.name,
          first_name: row.first_name,
          password_hash: row.password_hash,
          is_first_login: row.is_first_login,
          role: row.role,
          title: row.title
        };
      }
    } catch (e) {
      console.error("SQLite read error, falling back to JSON", e);
    }
  }
  
  // JSON fallback
  if (fs.existsSync(jsonDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
      return data[normEmail] || null;
    } catch (e) {
      console.error("JSON read error", e);
    }
  }
  return null;
}

function updateUserPassword(email: string, newHash: string): boolean {
  const normEmail = email.toLowerCase().trim();
  let success = false;
  if (useSqlite && sqliteDb) {
    try {
      sqliteDb.prepare("UPDATE users SET password_hash = ?, is_first_login = 0 WHERE email = ?").run(newHash, normEmail);
      success = true;
    } catch (e) {
      console.error("SQLite write error, trying JSON", e);
    }
  }
  
  // Update JSON as well to ensure parity and perfect fallback
  if (fs.existsSync(jsonDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
      if (data[normEmail]) {
        data[normEmail].password_hash = newHash;
        data[normEmail].is_first_login = 0;
        fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        success = true;
      }
    } catch (e) {
      console.error("JSON write error", e);
    }
  }
  return success;
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging and custom header middleware
  app.use((req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    res.setHeader("X-KPI-Portal", "Server-v2");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Authentication Endpoints
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = findUser(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const hashedInput = hashPassword(password);
    if (user.password_hash === hashedInput) {
      return res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name,
          firstName: user.first_name,
          role: user.role,
          title: user.title,
          isFirstLogin: user.is_first_login === 1
        }
      });
    }

    return res.status(401).json({ success: false, message: "Invalid email or password" });
  });

  app.post("/api/auth/change-password", (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    // Password validation rules: 8+ characters, at least 1 number, at least 1 uppercase letter
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must include at least 8 characters, contain at least 1 number and 1 upper case letter."
      });
    }

    const user = findUser(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If it's not the first login, we must verify current password
    if (user.is_first_login === 0) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required to change password" });
      }
      const hashedCurrentInput = hashPassword(currentPassword);
      if (user.password_hash !== hashedCurrentInput) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }
    }

    const newHash = hashPassword(newPassword);
    const updated = updateUserPassword(email, newHash);
    if (updated) {
      return res.json({ success: true, message: "Password updated successfully" });
    }

    return res.status(500).json({ success: false, message: "Failed to update password in database" });
  });

  app.get("/api/registrations", async (req, res) => {
    try {
      const response = await fetch("https://docs.google.com/spreadsheets/d/1rPsW1nfG_p6jLQRZD_n4-Ee38-BGYtVoCaMm0Gu15f8/gviz/tq?tqx=out:csv");
      const csvText = await response.text();
      
      const rows = csvText.split('\n').map(row => {
        // Simple CSV parser for quoted fields
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(match => match.replace(/^"|"$/g, ''));
      });

      if (rows.length < 2) {
         return res.json([]);
      }

      const headers = rows[0];
      const data = rows.slice(1).map((row) => {
        let obj: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching sheet:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
