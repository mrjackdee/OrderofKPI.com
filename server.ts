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
}

const defaultUsers = [
  { name: "Admin", email: "admin@orderofkpi.org", role: "admin" },
  { name: "Deshaun Safford", email: "deshaun.safford@orderofkpi.org", role: "member" },
  { name: "Darius Scott", email: "darius.scott@orderofkpi.org", role: "member" },
  { name: "Keiland Henderson", email: "keiland.henderson@orderofkpi.org", role: "member" },
  { name: "Reginald Williams", email: "reginald.williams@orderofkpi.org", role: "member" },
  { name: "Jelahn Cherry", email: "jelahn.cherry@orderofkpi.org", role: "member" },
  { name: "Myric Crawford", email: "myric.crawford@orderofkpi.org", role: "member" },
  { name: "Marcus Thomas", email: "marcus.thomas@orderofkpi.org", role: "member" },
  { name: "Demarion Smith", email: "demarion.smith@orderofkpi.org", role: "member" },
  { name: "Elijah Carter", email: "elijah.carter@orderofkpi.org", role: "member" },
  { name: "Devonte Jenkins", email: "devonte.jenkins@orderofkpi.org", role: "member" },
  { name: "Brian Johnson", email: "brian.johnson@orderofkpi.org", role: "member" },
  { name: "Ishmeal Allensworth", email: "ishmeal.allensworth@orderofkpi.org", role: "member" },
  { name: "Edward Cook", email: "edward.cook@orderofkpi.org", role: "member" },
  { name: "Darron Jenkins", email: "darron.jenkins@orderofkpi.org", role: "member" },
  { name: "James Haywood Jr", email: "james.haywood@orderofkpi.org", role: "member" },
  { name: "Dameone Ferguson", email: "dameone.ferguson@orderofkpi.org", role: "member" },
  { name: "Brian Goings", email: "brian.goings@orderofkpi.org", role: "member" },
  { name: "Keith Woods", email: "keith.woods@orderofkpi.org", role: "member" },
  { name: "Dominic Goodman", email: "dominic.goodman@orderofkpi.org", role: "member" },
  { name: "Jason Pilar", email: "jason.pilar@orderofkpi.org", role: "member" },
  { name: "Brandon Owens", email: "brandon.owens@orderofkpi.org", role: "member" },
  { name: "Jack Dee", email: "jack.dee@orderofkpi.org", role: "member" },
  { name: "Anthony Jones", email: "anthony.jones@orderofkpi.org", role: "member" },
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

try {
  // Try importing better-sqlite3
  const Database = require("better-sqlite3");
  const dbPath = path.join(process.cwd(), "kpi_members_v2.db");
  sqliteDb = new Database(dbPath);
  
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT,
      first_name TEXT,
      password_hash TEXT,
      is_first_login INTEGER DEFAULT 1,
      role TEXT
    )
  `);
  
  const countRes = sqliteDb.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (countRes.count === 0) {
    const insert = sqliteDb.prepare(`
      INSERT INTO users (email, name, first_name, password_hash, is_first_login, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const defaultPasswordHash = hashPassword("2012");
    for (const u of defaultUsers) {
      const firstName = u.name.split(" ")[0];
      insert.run(u.email.toLowerCase().trim(), u.name, firstName, defaultPasswordHash, 1, u.role);
    }
    console.log("SQLite database initialized and seeded with password 2012.");
  }
} catch (err) {
  console.log("SQLite loading failed, falling back to JSON database file.");
  useSqlite = false;
}

// Always ensure JSON database is seeded and available as a safe fallback/primary option
if (!useSqlite || !sqliteDb) {
  if (!fs.existsSync(jsonDbPath)) {
    const defaultPasswordHash = hashPassword("2012");
    const initialData: Record<string, UserRecord> = {};
    for (const u of defaultUsers) {
      const firstName = u.name.split(" ")[0];
      initialData[u.email.toLowerCase().trim()] = {
        email: u.email.toLowerCase().trim(),
        name: u.name,
        first_name: firstName,
        password_hash: defaultPasswordHash,
        is_first_login: 1,
        role: u.role
      };
    }
    fs.writeFileSync(jsonDbPath, JSON.stringify(initialData, null, 2));
    console.log("JSON database initialized and seeded with password 2012.");
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
          role: row.role
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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
