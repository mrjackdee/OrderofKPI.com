import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import nodemailer from "nodemailer";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Fallback JSON-based store or SQLite
interface UserRecord {
  email: string;
  name: string;
  first_name: string;
  last_name?: string;
  password_hash: string;
  is_first_login: number;
  role: string;
  roles?: string[] | string;
  title?: string;
  financial_status?: string;
  industry?: string;
  profile_photo?: string;
  is_test_credential?: number;
  committees?: string[] | string;
  committeeRoles?: Record<string, string> | string;
  committee_roles?: Record<string, string> | string;
}

const passwordOverridesPath = path.join(process.cwd(), "user_password_overrides.json");
const altPasswordOverridesPath = path.join(process.cwd(), "password_overrides.json");

let firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || "";
let firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || "";
let firebaseDatabaseId = process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-87b8a669-8698-4f66-8799-ff9b38422e20";
try {
  const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    if (!firebaseProjectId) firebaseProjectId = cfg.projectId || "";
    if (!firebaseApiKey) firebaseApiKey = cfg.apiKey || "";
    if (!process.env.VITE_FIREBASE_DATABASE_ID && cfg.firestoreDatabaseId) {
      firebaseDatabaseId = cfg.firestoreDatabaseId;
    }
  }
} catch (e) {}

interface PasswordOverrideRecord {
  hash: string;
  isFirstLogin: number;
  updatedAt: string;
}

let globalPasswordOverrides: Record<string, PasswordOverrideRecord> = {};

function loadPasswordOverridesFromFile() {
  globalPasswordOverrides = {
    "james.haywood@orderofkpi.org": { hash: hashPassword("2012"), isFirstLogin: 0, updatedAt: new Date().toISOString() }
  };

  if (fs.existsSync(passwordOverridesPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(passwordOverridesPath, "utf-8"));
      globalPasswordOverrides = { ...globalPasswordOverrides, ...data };
      console.log(`[AUTH] Loaded ${Object.keys(data).length} password overrides from user_password_overrides.json`);
    } catch (err) {
      console.error("[AUTH] Error loading password overrides file:", err);
    }
  }

  if (fs.existsSync(altPasswordOverridesPath)) {
    try {
      const altData = JSON.parse(fs.readFileSync(altPasswordOverridesPath, "utf-8"));
      globalPasswordOverrides = { ...globalPasswordOverrides, ...altData };
      console.log(`[AUTH] Loaded ${Object.keys(altData).length} password overrides from password_overrides.json`);
    } catch (err) {
      console.error("[AUTH] Error loading alt password overrides file:", err);
    }
  }

  // Also read kpi_members_v2.json to ensure any previously saved user passwords are present in memory
  if (fs.existsSync(jsonDbPath)) {
    try {
      const jsonUsers = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
      for (const [em, record] of Object.entries(jsonUsers)) {
        const norm = em.toLowerCase().trim();
        if (record.password_hash) {
          if (!globalPasswordOverrides[norm] || record.is_first_login === 0) {
            globalPasswordOverrides[norm] = {
              hash: record.password_hash,
              isFirstLogin: record.is_first_login ?? (record.password_hash === hashPassword("atlanta") ? 1 : 0),
              updatedAt: new Date().toISOString()
            };
          }
        }
      }
    } catch (e) {}
  }
}

async function syncPasswordOverridesFromFirestoreCloud() {
  if (!firebaseProjectId || !firebaseApiKey) return;
  try {
    const dbId = firebaseDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides?key=${firebaseApiKey}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.documents)) {
      let loadedCount = 0;
      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const email = fields.email?.stringValue || fields.email?.bytesValue || doc.name.split("/").pop() || "";
        const normEmail = email.toLowerCase().trim();
        const hash = fields.hash?.stringValue || "";
        const isFirstLogin = fields.isFirstLogin?.integerValue !== undefined
          ? Number(fields.isFirstLogin.integerValue)
          : (fields.isFirstLogin?.booleanValue === false ? 0 : (fields.isFirstLogin?.booleanValue === true ? 1 : 0));
        const updatedAt = fields.updatedAt?.stringValue || new Date().toISOString();

        if (normEmail && hash) {
          globalPasswordOverrides[normEmail] = { hash, isFirstLogin, updatedAt };
          loadedCount++;
          
          if (useSqlite && sqliteDb) {
            try {
              sqliteDb.prepare("UPDATE users SET password_hash = ?, is_first_login = ? WHERE LOWER(email) = ?").run(hash, isFirstLogin, normEmail);
            } catch (e) {}
          }
          if (fs.existsSync(jsonDbPath)) {
            try {
              const jsonUsers = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
              if (jsonUsers[normEmail]) {
                jsonUsers[normEmail].password_hash = hash;
                jsonUsers[normEmail].is_first_login = isFirstLogin;
                fs.writeFileSync(jsonDbPath, JSON.stringify(jsonUsers, null, 2));
              }
            } catch (e) {}
          }
        }
      }
      if (loadedCount > 0) {
        console.log(`[AUTH Cloud Sync] Hydrated ${loadedCount} password overrides from Cloud Firestore.`);
      }
    }
  } catch (err) {
    console.warn("[AUTH Cloud Sync] Firestore cloud password sync notice:", err);
  }
}

function savePasswordOverride(email: string, hash: string, isFirstLogin: number = 0) {
  const normEmail = email.toLowerCase().trim();
  globalPasswordOverrides[normEmail] = {
    hash,
    isFirstLogin,
    updatedAt: new Date().toISOString()
  };
  try {
    fs.writeFileSync(passwordOverridesPath, JSON.stringify(globalPasswordOverrides, null, 2));
    fs.writeFileSync(altPasswordOverridesPath, JSON.stringify(globalPasswordOverrides, null, 2));
    console.log(`[AUTH] Password override saved persistently for: ${normEmail}`);
  } catch (err) {
    console.error("[AUTH] Failed to save password override file:", err);
  }

  // Push to Firestore Cloud asynchronously so changed passwords persist across container resets & all environments
  if (firebaseProjectId && firebaseApiKey) {
    const docId = normEmail.replace(/\//g, "_");
    const dbId = firebaseDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          email: { stringValue: normEmail },
          hash: { stringValue: hash },
          isFirstLogin: { integerValue: isFirstLogin },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      })
    }).then(res => {
      if (res.ok) console.log(`[AUTH Cloud Sync] Pushed password override to Firestore for: ${normEmail}`);
      else console.warn(`[AUTH Cloud Sync] Firestore PATCH status: ${res.status}`);
    }).catch(err => {
      console.warn("[AUTH Cloud Sync] Error pushing to Firestore:", err);
    });

    // Also update candidate_accounts in Firestore if candidate
    const candUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/candidate_accounts/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
    fetch(candUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          email: { stringValue: normEmail },
          isFirstLogin: { booleanValue: isFirstLogin === 1 },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      })
    }).catch(() => {});
  }
}

async function syncPortalMembersFromFirestoreCloud() {
  if (!firebaseProjectId || !firebaseApiKey) return;
  try {
    const dbId = firebaseDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/portal_members?key=${firebaseApiKey}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.documents)) {
      let loadedCount = 0;
      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const email = fields.email?.stringValue || doc.name.split("/").pop() || "";
        const normEmail = email.toLowerCase().trim();
        const name = fields.name?.stringValue || "";
        const first_name = fields.first_name?.stringValue || name.split(" ")[0] || "";
        const last_name = fields.last_name?.stringValue || name.split(" ").slice(1).join(" ") || "";
        const role = fields.role?.stringValue || "member";
        const title = fields.title?.stringValue || "";
        const financial_status = fields.financial_status?.stringValue || "inactive";
        const industry = fields.industry?.stringValue || "";
        const profile_photo = fields.profile_photo?.stringValue || "";
        const is_test_val = fields.is_test_credential?.booleanValue !== undefined ? (fields.is_test_credential.booleanValue ? 1 : 0) : ((normEmail.startsWith("qa.") || normEmail.startsWith("test.")) ? 1 : 0);
        
        let committeesArray: string[] = [];
        if (fields.committees?.arrayValue?.values) {
          committeesArray = fields.committees.arrayValue.values.map((v: any) => v.stringValue).filter(Boolean);
        } else if (fields.committees?.stringValue) {
          try { committeesArray = JSON.parse(fields.committees.stringValue); } catch(e) {}
        }
        const committeesStr = JSON.stringify(committeesArray);

        let committeeRolesMap: Record<string, string> = {};
        if (fields.committeeRoles?.mapValue?.fields) {
          Object.keys(fields.committeeRoles.mapValue.fields).forEach(k => {
            committeeRolesMap[k] = fields.committeeRoles.mapValue.fields[k]?.stringValue || 'member';
          });
        } else if (fields.committee_roles?.stringValue) {
          try { committeeRolesMap = JSON.parse(fields.committee_roles.stringValue); } catch(e) {}
        } else if (fields.committeeRoles?.stringValue) {
          try { committeeRolesMap = JSON.parse(fields.committeeRoles.stringValue); } catch(e) {}
        }
        const committeeRolesStr = JSON.stringify(committeeRolesMap);

        if (normEmail) {
          loadedCount++;
          
          if (useSqlite && sqliteDb) {
            try {
              const existingUser = sqliteDb.prepare("SELECT email FROM users WHERE email = ?").get(normEmail);
              if (existingUser) {
                sqliteDb.prepare(`
                  UPDATE users 
                  SET name = ?, first_name = ?, last_name = ?, role = ?, title = ?, financial_status = ?, industry = ?, profile_photo = ?, is_test_credential = ?, committees = ?, committee_roles = ?
                  WHERE email = ?
                `).run(name, first_name, last_name, role, title, financial_status, industry, profile_photo, is_test_val, committeesStr, committeeRolesStr, normEmail);
              } else {
                const defaultPasswordHash = hashPassword("atlanta");
                sqliteDb.prepare(`
                  INSERT INTO users (email, name, first_name, last_name, password_hash, is_first_login, role, title, financial_status, industry, profile_photo, is_test_credential, committees, committee_roles)
                  VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(normEmail, name, first_name, last_name, defaultPasswordHash, role, title, financial_status, industry, profile_photo, is_test_val, committeesStr, committeeRolesStr);
              }
            } catch (e) {
              console.error("[PORTAL MEMBERS Cloud Sync] SQLite sync err:", e);
            }
          }
          if (fs.existsSync(jsonDbPath)) {
            try {
              const jsonUsers = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, any>;
              if (!jsonUsers[normEmail]) {
                const defaultPasswordHash = hashPassword("atlanta");
                jsonUsers[normEmail] = {
                  email: normEmail,
                  name,
                  first_name,
                  last_name,
                  password_hash: defaultPasswordHash,
                  is_first_login: 1,
                  role,
                  title,
                  financial_status,
                  industry,
                  profile_photo,
                  is_test_credential: is_test_val,
                  committees: committeesArray,
                  committeeRoles: committeeRolesMap
                };
              } else {
                jsonUsers[normEmail].name = name;
                jsonUsers[normEmail].first_name = first_name;
                jsonUsers[normEmail].last_name = last_name;
                jsonUsers[normEmail].role = role;
                jsonUsers[normEmail].title = title;
                jsonUsers[normEmail].financial_status = financial_status;
                jsonUsers[normEmail].industry = industry;
                jsonUsers[normEmail].profile_photo = profile_photo;
                jsonUsers[normEmail].is_test_credential = is_test_val;
                jsonUsers[normEmail].committees = committeesArray;
                jsonUsers[normEmail].committeeRoles = committeeRolesMap;
              }
              fs.writeFileSync(jsonDbPath, JSON.stringify(jsonUsers, null, 2));
            } catch (e) {
              console.error("[PORTAL MEMBERS Cloud Sync] JSON sync err:", e);
            }
          }
        }
      }
      if (loadedCount > 0) {
        console.log(`[PORTAL MEMBERS Cloud Sync] Hydrated ${loadedCount} custom members from Cloud Firestore.`);
      }
    }
  } catch (err) {
    console.warn("[PORTAL MEMBERS Cloud Sync] Firestore cloud members sync notice:", err);
  }
}

async function syncLocalMemberToFirestoreCloud(email: string) {
  if (!firebaseProjectId || !firebaseApiKey) return;
  const normEmail = email.toLowerCase().trim();
  let member: any = null;
  if (useSqlite && sqliteDb) {
    member = sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(normEmail);
  } else if (fs.existsSync(jsonDbPath)) {
    const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
    member = data[normEmail];
  }
  if (!member) return;

  let memberCommittees: string[] = [];
  try {
    if (Array.isArray(member.committees)) memberCommittees = member.committees;
    else if (typeof member.committees === 'string') memberCommittees = JSON.parse(member.committees);
  } catch (e) {}

  let memberCommitteeRoles: Record<string, string> = {};
  try {
    if (member.committeeRoles && typeof member.committeeRoles === 'object') memberCommitteeRoles = member.committeeRoles;
    else if (member.committee_roles && typeof member.committee_roles === 'object') memberCommitteeRoles = member.committee_roles;
    else if (typeof member.committee_roles === 'string') memberCommitteeRoles = JSON.parse(member.committee_roles);
    else if (typeof member.committeeRoles === 'string') memberCommitteeRoles = JSON.parse(member.committeeRoles);
  } catch (e) {}

  const committeeRolesFields: Record<string, { stringValue: string }> = {};
  Object.keys(memberCommitteeRoles).forEach(k => {
    committeeRolesFields[k] = { stringValue: memberCommitteeRoles[k] };
  });

  const docId = normEmail.replace(/\//g, "_");
  const dbId = firebaseDatabaseId || "(default)";
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/portal_members/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
  
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          email: { stringValue: normEmail },
          name: { stringValue: member.name || "" },
          first_name: { stringValue: member.first_name || "" },
          last_name: { stringValue: member.last_name || "" },
          role: { stringValue: member.role || "member" },
          title: { stringValue: member.title || "" },
          financial_status: { stringValue: member.financial_status || "inactive" },
          industry: { stringValue: member.industry || "" },
          profile_photo: { stringValue: member.profile_photo || "" },
          is_test_credential: { booleanValue: !!(member.is_test_credential === 1 || member.is_test_credential === true) },
          committees: {
            arrayValue: {
              values: memberCommittees.map(c => ({ stringValue: c }))
            }
          },
          committeeRoles: {
            mapValue: {
              fields: committeeRolesFields
            }
          }
        }
      })
    });
    if (res.ok) {
      console.log(`[PORTAL MEMBERS Cloud Sync] Pushed member to Firestore: ${normEmail}`);
    } else {
      console.warn(`[PORTAL MEMBERS Cloud Sync] Firestore PATCH status: ${res.status}`);
    }
  } catch (err) {
    console.warn("[PORTAL MEMBERS Cloud Sync] Error pushing member to Firestore:", err);
  }
}

async function deletePortalMemberFromFirestoreCloud(email: string) {
  if (!firebaseProjectId || !firebaseApiKey) return;
  const normEmail = email.toLowerCase().trim();
  const docId = normEmail.replace(/\//g, "_");
  const dbId = firebaseDatabaseId || "(default)";
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/portal_members/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
  try {
    const res = await fetch(url, {
      method: "DELETE"
    });
    if (res.ok) {
      console.log(`[PORTAL MEMBERS Cloud Sync] Deleted member from Firestore: ${normEmail}`);
    } else {
      console.warn(`[PORTAL MEMBERS Cloud Sync] Firestore DELETE status: ${res.status}`);
    }
  } catch (err) {
    console.warn("[PORTAL MEMBERS Cloud Sync] Error deleting member from Firestore:", err);
  }
}

const QA_EXPLICIT_CREDENTIALS: Record<string, { name: string; role: string; title: string; pass: string }> = {
  'qa.admin@orderofkpi.org': { name: 'QA Admin Agent', role: 'admin', title: 'Administrator', pass: 'KPI_QA_Admin2026!' },
  'qa.chair@orderofkpi.org': { name: 'QA Chair Agent', role: 'Membership Committee Chair', title: '2nd Anti-Basileus / Committee Chair', pass: 'KPI_QA_Chair2026!' },
  'qa.committee@orderofkpi.org': { name: 'QA Committee Agent', role: 'Membership Committee', title: 'Grammateus / Committee Member', pass: 'KPI_QA_Committee2026!' },
  'qa.officer@orderofkpi.org': { name: 'QA Officer Agent', role: 'officer', title: '1st Anti-Basileus', pass: 'KPI_QA_Officer2026!' },
  'qa.member@orderofkpi.org': { name: 'QA Member Agent', role: 'member', title: 'Member', pass: 'KPI_QA_Member2026!' }
};

const defaultUsers = [
  { name: "QA Admin Agent", email: "qa.admin@orderofkpi.org", role: "admin", title: "Administrator", financial_status: "active", industry: "" },
  { name: "QA Chair Agent", email: "qa.chair@orderofkpi.org", role: "Membership Committee Chair", title: "2nd Anti-Basileus / Committee Chair", financial_status: "active", industry: "", committees: ["membership_intake"], committee_roles: { membership_intake: "chair" } },
  { name: "QA Committee Agent", email: "qa.committee@orderofkpi.org", role: "Membership Committee", title: "Grammateus / Committee Member", financial_status: "active", industry: "", committees: ["membership_intake"], committee_roles: { membership_intake: "member" } },
  { name: "QA Officer Agent", email: "qa.officer@orderofkpi.org", role: "officer", title: "1st Anti-Basileus", financial_status: "active", industry: "" },
  { name: "QA Member Agent", email: "qa.member@orderofkpi.org", role: "member", title: "", financial_status: "active", industry: "" },
  { name: "Admin", email: "admin@orderofkpi.org", role: "admin", title: "Administrator", financial_status: "active", industry: "" },
  { name: "James Haywood Jr", email: "james.haywood@orderofkpi.org", role: "Membership Committee Chair", title: "2nd Anti-Basileus / Committee Chair", financial_status: "active", industry: "", committees: ["membership_intake"], committee_roles: { membership_intake: "chair" } },
  { name: "Jack Dee", email: "jack.dee@orderofkpi.org", role: "officer", financial_status: "active", industry: "" },
  { name: "DeShaun Safford", email: "deshaun.safford@orderofkpi.org", role: "Membership Committee", financial_status: "active", industry: "", committees: ["membership_intake"], committee_roles: { membership_intake: "member" } },
  { name: "Brian Johnson", email: "brian.johnson@orderofkpi.org", role: "officer", title: "Officer", financial_status: "active", industry: "" },
  { name: "Jason Pilar", email: "jason.pilar@orderofkpi.org", role: "Membership Committee", financial_status: "active", industry: "", committees: ["membership_intake"], committee_roles: { membership_intake: "member" } },
  { name: "Ishmeal Allensworth", email: "ishmeal.allensworth@orderofkpi.org", role: "officer", title: "Tamiouchos", financial_status: "active", industry: "" },
  { name: "Edward Cook", email: "edward.cook@orderofkpi.org", role: "officer", title: "Epistoleus", financial_status: "active", industry: "", committees: ["judicial_ethics"], committee_roles: { judicial_ethics: "member" } },
  { name: "Darron Jenkins", email: "darron.jenkins@orderofkpi.org", role: "officer", title: "Hodegos", financial_status: "active", industry: "" },
  { name: "Brian Goings", email: "brian.goings@orderofkpi.org", role: "officer", title: "Basileus", financial_status: "active", industry: "" },
  { name: "Keith Woods", email: "keith.woods@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["annual_event"], committee_roles: { annual_event: "member" } },
  { name: "Sammie Poe", email: "sammie.poe@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["annual_event"], committee_roles: { annual_event: "member" } },
  { name: "Donald Mitchell", email: "donald.mitchell@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["judicial_ethics"], committee_roles: { judicial_ethics: "member" } },
  { name: "Dominic Goodman", email: "dominic.goodman@orderofkpi.org", role: "member", financial_status: "inactive", industry: "", committees: ["scholarship"], committee_roles: { scholarship: "member" } },
  { name: "Brandon Owens", email: "brandon.owens@orderofkpi.org", role: "officer", title: "Historian", financial_status: "active", industry: "" },
  { name: "Anthony Jones", email: "anthony.jones@orderofkpi.org", role: "Super Committee", title: "1st Anti-Basileus", financial_status: "active", industry: "", roles: ["officer", "Super Committee"] },
  { name: "Alejandro Araujo", email: "alejandro.araujo@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["digital_technology"], committee_roles: { digital_technology: "member" } },
  { name: "Demetrist Thomas", email: "demetrist.thomas@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["transfer_member"], committee_roles: { transfer_member: "member" } },
  { name: "Denzel Talley", email: "denzel.talley@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["scholarship"], committee_roles: { scholarship: "member" } },
  { name: "Kameron Whitfield", email: "kameron.whitfield@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["digital_technology"], committee_roles: { digital_technology: "member" } },
  { name: "Kevin Jennings", email: "kevin.jennings@orderofkpi.org", role: "member", financial_status: "active", industry: "" },
  { name: "Tobias Bordley", email: "tobias.bordley@orderofkpi.org", role: "member", financial_status: "active", industry: "", committees: ["transfer_member"], committee_roles: { transfer_member: "member" } },
  { name: "Brandon Hunter", email: "brandon.hunter@orderofkpi.org", role: "member", title: "", financial_status: "active", industry: "" },
  { name: "Terrell Singleton", email: "terrell.singleton@orderofkpi.org", role: "member", title: "", financial_status: "active", industry: "" },
  { name: "Churtis Poulson", email: "churtis.poulson@orderofkpi.org", role: "member", title: "", financial_status: "active", industry: "" },
  { name: "Charles Basham", email: "charles.basham@orderofkpi.org", role: "member", title: "", financial_status: "active", industry: "" }
];

const initialCandidates = [
  { name: "Avery Torrence", email: "averyt16@gmail.com", phone: "770-873-0784", pass: "0784" },
  { name: "Charles Miller", email: "hupirate90@me.com", phone: "301-602-9348", pass: "9348" },
  { name: "Quincy Dinnerson", email: "quincyld86@gmail.com", phone: "336-420-1326", pass: "1326" },
  { name: "Jabari Smith-Perry", email: "jabari.smithperry@gmail.com", phone: "404-784-7008", pass: "7008" },
  { name: "Lee Sennet", email: "l.a.sennet@gmail.com", phone: "281-740-1774", pass: "1774" },
  { name: "Malinski Russell", email: "malineskidrussell@gmail.com", phone: "731-273-0011", pass: "0011" },
  { name: "Michael L Coleman", email: "mabmykie1914@gmail.com", phone: "917-283-7119", pass: "7119" },
  { name: "Ronald Oliver", email: "roliver449@gmail.com", phone: "773-842-6846", pass: "6846" },
  { name: "Steven Burnette", email: "burnettesteven3@gmail.com", phone: "336-437-2275", pass: "2275" },
  { name: "Tashaun Najee Benton", email: "tashaunbenton233@gmail.com", phone: "973-592-1821", pass: "1821" },
  { name: "Titus Oliver", email: "o_titus@yahoo.com", phone: "662-654-7713", pass: "7713" },
  { name: "Zion Gates-Norris", email: "zgatesnorris@gmail.com", phone: "954-234-4876", pass: "4876" },
  { name: "Jamar Amber", email: "jaabn2@gmail.com", phone: "410-443-3795", pass: "3795" }
];

let useSqlite = true;
let cachedSheetData: { lastFetched: number; data: any } = { lastFetched: 0, data: null };
let sqliteDb: any = null;
const jsonDbPath = path.join(process.cwd(), "kpi_members_v2.json");
const candidatesJsonPath = path.join(process.cwd(), "candidates_fallback.json");
const deletedCandidatesJsonPath = path.join(process.cwd(), "deleted_candidates.json");

function getDeletedCandidatesSet(): Set<string> {
  const deletedSet = new Set<string>();
  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare("SELECT id_or_email FROM deleted_candidates").all() as any[];
      for (const row of rows) {
        if (row.id_or_email) deletedSet.add(row.id_or_email.toLowerCase().trim());
      }
    } catch (e) {}
  }
  if (fs.existsSync(deletedCandidatesJsonPath)) {
    try {
      const jsonList = JSON.parse(fs.readFileSync(deletedCandidatesJsonPath, "utf-8"));
      if (Array.isArray(jsonList)) {
        jsonList.forEach((item: string) => {
          if (item) deletedSet.add(item.toLowerCase().trim());
        });
      }
    } catch (e) {}
  }
  return deletedSet;
}

function recordDeletedCandidate(id: string, email?: string) {
  const deletedSet = getDeletedCandidatesSet();
  if (id) deletedSet.add(id.toLowerCase().trim());
  if (email) deletedSet.add(email.toLowerCase().trim());

  if (useSqlite && sqliteDb) {
    try {
      const now = new Date().toISOString();
      if (id) {
        sqliteDb.prepare("INSERT OR REPLACE INTO deleted_candidates (id_or_email, deleted_at) VALUES (?, ?)").run(id.toLowerCase().trim(), now);
      }
      if (email) {
        sqliteDb.prepare("INSERT OR REPLACE INTO deleted_candidates (id_or_email, deleted_at) VALUES (?, ?)").run(email.toLowerCase().trim(), now);
      }
    } catch (e) {}
  }

  try {
    fs.writeFileSync(deletedCandidatesJsonPath, JSON.stringify(Array.from(deletedSet), null, 2));
  } catch (e) {}
}

function clearDeletedCandidateRecord(id: string, email?: string) {
  if (useSqlite && sqliteDb) {
    try {
      if (id) sqliteDb.prepare("DELETE FROM deleted_candidates WHERE LOWER(id_or_email) = ?").run(id.toLowerCase().trim());
      if (email) sqliteDb.prepare("DELETE FROM deleted_candidates WHERE LOWER(id_or_email) = ?").run(email.toLowerCase().trim());
    } catch (e) {}
  }
  try {
    if (fs.existsSync(deletedCandidatesJsonPath)) {
      const jsonList = JSON.parse(fs.readFileSync(deletedCandidatesJsonPath, "utf-8"));
      if (Array.isArray(jsonList)) {
        const filtered = jsonList.filter((item: string) => {
          const norm = item.toLowerCase().trim();
          return norm !== (id || "").toLowerCase().trim() && norm !== (email || "").toLowerCase().trim();
        });
        fs.writeFileSync(deletedCandidatesJsonPath, JSON.stringify(filtered, null, 2));
      }
    }
  } catch (e) {}
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function initDb() {
  loadPasswordOverridesFromFile();
  await syncPasswordOverridesFromFirestoreCloud();
  await syncPortalMembersFromFirestoreCloud();

  const allowedEmails = new Set([
    ...defaultUsers.map(u => u.email.toLowerCase().trim()),
    ...initialCandidates.map(c => c.email.toLowerCase().trim())
  ]);
  const defaultPasswordHash = hashPassword("atlanta");
  const userPasswordOverrides: Record<string, string> = {
    "james.haywood@orderofkpi.org": "2012",
    "admin@orderofkpi.org": "2012",
    "donald.mitchell@orderofkpi.org": "1914",
    "sammie.poe@orderofkpi.org": "atlanta",
    "churtis.poulson@orderofkpi.org": "atlanta"
  };
  const testUsers = ["admin@orderofkpi.org"];

  const setupSqliteDb = async () => {
    const { default: Database } = await import("better-sqlite3");
    const dbPath = path.join(process.cwd(), "kpi_members_v2.db");
    
    // Check if dbPath exists and is 0-byte file before opening (which causes 'database disk image is malformed')
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      if (stats.size === 0) {
        try { fs.unlinkSync(dbPath); } catch (_) {}
      }
    }

    sqliteDb = new Database(dbPath, { timeout: 10000 });
    try {
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('busy_timeout = 10000');
    } catch (_) {}
    
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT,
        first_name TEXT,
        last_name TEXT,
        password_hash TEXT,
        is_first_login INTEGER DEFAULT 1,
        role TEXT,
        title TEXT,
        financial_status TEXT DEFAULT 'inactive',
        profile_photo TEXT,
        industry TEXT,
        is_test_credential INTEGER DEFAULT 0
      )
    `);

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN last_name TEXT");
    } catch (e) {
      // Column already exists
    }

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN is_test_credential INTEGER DEFAULT 0");
    } catch (e) {
      // Column already exists
    }

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN committees TEXT");
    } catch (e) {
      // Column already exists
    }

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN committee_roles TEXT");
    } catch (e) {
      // Column already exists
    }

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN roles TEXT");
    } catch (e) {
      // Column already exists
    }

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT,
        application_date TEXT,
        scores TEXT,
        notes TEXT,
        document_vault TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS deleted_candidates (
        id_or_email TEXT PRIMARY KEY,
        deleted_at TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        voter_email TEXT,
        candidate_id TEXT,
        decision TEXT,
        timestamp TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS membership_applications (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        data TEXT,
        status TEXT DEFAULT 'draft',
        last_saved_at TEXT,
        submitted_at TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS dean_nominations (
        id TEXT PRIMARY KEY,
        voter_email TEXT UNIQUE,
        nominee_first_name TEXT,
        nominee_last_name TEXT,
        statement TEXT,
        timestamp TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS dean_votes (
        id TEXT PRIMARY KEY,
        voter_email TEXT UNIQUE,
        nominee_name TEXT,
        timestamp TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS candidate_votes (
        id TEXT PRIMARY KEY,
        voter_email TEXT,
        candidate_id TEXT,
        candidate_name TEXT,
        decision TEXT,
        timestamp TEXT
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now')),
        email TEXT,
        event_type TEXT,
        message TEXT,
        severity TEXT DEFAULT 'info'
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS application_audit_logs (
        id TEXT PRIMARY KEY,
        reviewer_email TEXT,
        reviewer_name TEXT,
        applicant_email TEXT,
        applicant_name TEXT,
        action TEXT,
        timestamp TEXT
      )
    `);

    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN title TEXT");
    } catch (e) {
      // Column already exists
    }
    
    // Ensure legacy deshaun.stafford@orderofkpi.org, dennis@gmail.com, jackdee.sync@gmail.com, and candidate@gmail.com accounts are purged
    try {
      sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) IN ('deshaun.stafford@orderofkpi.org', 'candidate@orderofkpi.org', 'dennis@gmail.com', 'candidate@gmail.com', 'jackdee.sync@gmail.com')").run();
      sqliteDb.prepare("DELETE FROM candidates WHERE LOWER(email) IN ('candidate@orderofkpi.org', 'dennis@gmail.com', 'candidate@gmail.com', 'jackdee.sync@gmail.com')").run();
      sqliteDb.prepare("DELETE FROM membership_applications WHERE LOWER(email) IN ('dennis@gmail.com', 'candidate@gmail.com', 'jackdee.sync@gmail.com')").run();
    } catch (e) {
      // Ignore
    }

    // SQLite Cleanup (Only log, do not delete dynamically added members)
    const existingRows = sqliteDb.prepare("SELECT email FROM users").all() as { email: string }[];
    for (const row of existingRows) {
      const emailNorm = row.email.toLowerCase().trim();
      if (!allowedEmails.has(emailNorm)) {
        console.log(`[DB Audit] Custom dynamic user active in SQLite: ${emailNorm}`);
      }
    }

    // Add or update users to align with latest roles and titles, preserving existing password hashes and first_login status
    for (const u of defaultUsers) {
      const emailNorm = u.email.toLowerCase().trim();
      const firstName = u.name.split(" ")[0];
      const isTestCred = (emailNorm.startsWith("qa.") || emailNorm.startsWith("test.")) ? 1 : 0;
      const existingUser = sqliteDb.prepare("SELECT password_hash, is_first_login FROM users WHERE email = ?").get(emailNorm) as any;
      
      const override = globalPasswordOverrides[emailNorm];
      let targetPasswordHash = defaultPasswordHash;
      let targetIsFirstLogin = 1;

      if (override) {
        targetPasswordHash = override.hash;
        targetIsFirstLogin = override.isFirstLogin;
      } else if (existingUser) {
        targetPasswordHash = existingUser.password_hash;
        targetIsFirstLogin = existingUser.is_first_login;
      } else if (emailNorm === "james.haywood@orderofkpi.org") {
        targetPasswordHash = hashPassword("2012");
        targetIsFirstLogin = 0;
      } else if (emailNorm === "admin@orderofkpi.org") {
        targetPasswordHash = hashPassword("2012");
        targetIsFirstLogin = 0;
      } else if (emailNorm === "donald.mitchell@orderofkpi.org") {
        targetPasswordHash = hashPassword("1914");
        targetIsFirstLogin = 0;
      } else if (emailNorm === "sammie.poe@orderofkpi.org") {
        targetPasswordHash = hashPassword("atlanta");
        targetIsFirstLogin = 0;
      }

      const defaultComms = (u as any).committees ? JSON.stringify((u as any).committees) : "[]";
      const defaultRoles = (u as any).committee_roles ? JSON.stringify((u as any).committee_roles) : "{}";
      const defaultMultiRoles = JSON.stringify((u as any).roles || [u.role]);

      if (existingUser) {
        let currentRole = u.role;
        let currentRoles = defaultMultiRoles;
        let currentTitle = u.title || "";
        let currentComms = defaultComms;
        let currentCommitteeRoles = defaultRoles;

        const row = sqliteDb.prepare("SELECT role, roles, title, committees, committee_roles FROM users WHERE email = ?").get(emailNorm) as any;
        if (row) {
          currentRole = row.role || u.role;
          currentRoles = row.roles || JSON.stringify([currentRole]);
          currentTitle = row.title !== null && row.title !== undefined ? row.title : (u.title || "");
          currentComms = row.committees !== null && row.committees !== undefined && row.committees !== "[]" ? row.committees : defaultComms;
          currentCommitteeRoles = row.committee_roles !== null && row.committee_roles !== undefined && row.committee_roles !== "{}" ? row.committee_roles : defaultRoles;
        }

        sqliteDb.prepare(`
          UPDATE users 
          SET name = ?, first_name = ?, last_name = ?, role = ?, roles = ?, title = ?, 
              financial_status = ?, password_hash = ?, is_first_login = ?,
              is_test_credential = ?, committees = ?, committee_roles = ?
          WHERE email = ?
        `).run(
          u.name, 
          firstName, 
          u.name.split(" ").slice(1).join(" ") || "",
          currentRole, 
          currentRoles,
          currentTitle, 
          u.financial_status || "inactive", 
          targetPasswordHash,
          targetIsFirstLogin,
          isTestCred,
          currentComms,
          currentCommitteeRoles,
          emailNorm
        );
      } else {
        sqliteDb.prepare(`
          INSERT INTO users (
            email, name, first_name, last_name, password_hash, is_first_login, 
            role, roles, title, 
            financial_status, industry, is_test_credential, committees, committee_roles
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          emailNorm, 
          u.name, 
          firstName, 
          u.name.split(" ").slice(1).join(" ") || "",
          targetPasswordHash, 
          targetIsFirstLogin,
          u.role, 
          defaultMultiRoles,
          u.title || "",
          u.financial_status || "inactive",
          u.industry || "",
          isTestCred,
          defaultComms,
          defaultRoles
        );
      }
    }

    // Seed official initial candidates while preserving created/reset passwords
    const initialDeletedSet = getDeletedCandidatesSet();
    for (const c of initialCandidates) {
      const emailNorm = c.email.toLowerCase().trim();
      const candId = 'cand_' + emailNorm.replace(/[^a-z0-9]/g, '_');
      if (initialDeletedSet.has(emailNorm) || initialDeletedSet.has(candId)) {
        continue;
      }
      const firstName = c.name.split(" ")[0];
      const passHash = hashPassword(c.pass);
      const isTestCred = (emailNorm.startsWith("qa.") || emailNorm.startsWith("test.")) ? 1 : 0;

      const existingUser = sqliteDb.prepare("SELECT password_hash FROM users WHERE email = ?").get(emailNorm) as any;
      if (!existingUser) {
        sqliteDb.prepare(`
          INSERT INTO users (
            email, name, first_name, password_hash, is_first_login, 
            role, title, 
            financial_status, is_test_credential
          )
          VALUES (?, ?, ?, ?, 0, 'prospective', 'Candidate', 'inactive', ?)
        `).run(emailNorm, c.name, firstName, passHash, isTestCred);
      } else {
        sqliteDb.prepare(`
          UPDATE users SET role = 'prospective', name = ?, first_name = ?, is_test_credential = ? WHERE email = ?
        `).run(c.name, firstName, isTestCred, emailNorm);
      }

      // Also seed into candidates tracking table
      const existingCand = sqliteDb.prepare("SELECT id, status FROM candidates WHERE email = ?").get(emailNorm) as any;
      if (!existingCand) {
        sqliteDb.prepare(`
          INSERT INTO candidates (id, name, email, phone, status, application_date, scores, notes, document_vault)
          VALUES (?, ?, ?, ?, 'Inquiry', NULL, '{}', '', '[]')
        `).run('cand_' + emailNorm.replace(/[^a-z0-9]/g, '_'), c.name, emailNorm, c.phone);
      } else {
        sqliteDb.prepare("UPDATE candidates SET name = ?, phone = ? WHERE id = ?").run(c.name, c.phone, existingCand.id);
        if (existingCand.status === 'Under Review') {
          sqliteDb.prepare("UPDATE candidates SET status = 'Inquiry' WHERE id = ?").run(existingCand.id);
        }
      }
    }

    sqliteDb.prepare("UPDATE candidates SET status = 'Inquiry' WHERE status = 'Under Review'").run();

    console.log("SQLite database synchronized with official active roster and candidates.");
  };

  try {
    await setupSqliteDb();
  } catch (err: any) {
    console.warn("Initial SQLite database loading failed. Cleaning corrupted database image and re-initializing...", err?.message || err);
    try {
      if (sqliteDb) {
        try { sqliteDb.close(); } catch (_) {}
        sqliteDb = null;
      }
      const dbPath = path.join(process.cwd(), "kpi_members_v2.db");
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal");
      if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm");

      await setupSqliteDb();
      useSqlite = true;
    } catch (retryErr) {
      console.warn("SQLite database re-initialization failed, falling back to JSON database file:", retryErr);
      useSqlite = false;
      sqliteDb = null;
    }
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

    // Filter out invalid users (preserve dynamic members)
    const cleanData: Record<string, UserRecord> = { ...initialData };
    for (const [email, user] of Object.entries(initialData)) {
      const emailNorm = email.toLowerCase().trim();
      if (!allowedEmails.has(emailNorm)) {
        console.log(`[DB Audit] Custom dynamic user active in JSON DB: ${emailNorm}`);
      }
    }

    // Add missing users or update roles/titles for existing ones without overwriting user-updated passwords
    for (const u of defaultUsers) {
      const emailNorm = u.email.toLowerCase().trim();
      const customPass = userPasswordOverrides[emailNorm];
      const override = globalPasswordOverrides[emailNorm];
      const initialHash = override ? override.hash : (customPass ? hashPassword(customPass) : defaultPasswordHash);
      const initialIsFirstLogin = override ? override.isFirstLogin : (customPass ? 0 : 1);
      const isTestCred = (emailNorm.startsWith("qa.") || emailNorm.startsWith("test.")) ? 1 : 0;

      if (!cleanData[emailNorm]) {
        const firstName = u.name.split(" ")[0];
        cleanData[emailNorm] = {
          email: emailNorm,
          name: u.name,
          first_name: firstName,
          password_hash: initialHash,
          is_first_login: initialIsFirstLogin,
          role: u.role,
          title: u.title || "",
          is_test_credential: isTestCred
        };
      } else {
        cleanData[emailNorm].role = u.role;
        cleanData[emailNorm].title = u.title || "";
        cleanData[emailNorm].is_test_credential = isTestCred;
        if (override) {
          cleanData[emailNorm].password_hash = override.hash;
          cleanData[emailNorm].is_first_login = override.isFirstLogin;
        } else if (customPass) {
          cleanData[emailNorm].password_hash = hashPassword(customPass);
        }
      }
    }

    for (const c of initialCandidates) {
      const emailNorm = c.email.toLowerCase().trim();
      const firstName = c.name.split(" ")[0];
      const passHash = hashPassword(c.pass);
      const isTestCred = (emailNorm.startsWith("qa.") || emailNorm.startsWith("test.")) ? 1 : 0;

      if (!cleanData[emailNorm]) {
        cleanData[emailNorm] = {
          email: emailNorm,
          name: c.name,
          first_name: firstName,
          password_hash: passHash,
          is_first_login: 0,
          role: "prospective",
          title: "Candidate",
          is_test_credential: isTestCred
        };
      } else {
        cleanData[emailNorm].name = c.name;
        cleanData[emailNorm].first_name = firstName;
        cleanData[emailNorm].role = "prospective";
        cleanData[emailNorm].title = "Candidate";
        cleanData[emailNorm].is_test_credential = isTestCred;
      }
    }

    // Ensure old/deprecated logins are permanently purged
    delete cleanData['brandon.addison@orderofkpi.org'];
    delete cleanData['dmitchell02@gmail.com'];
    delete cleanData['ishmael.allensworth@orderofkpi.org'];
    delete cleanData['terrell.singleton@gmail.com'];
    delete cleanData['jack@orderofkpi.org'];
    delete cleanData['poul528@gmail.com'];
    if (useSqlite && sqliteDb) {
      try {
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'brandon.addison@orderofkpi.org'").run();
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'dmitchell02@gmail.com'").run();
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'ishmael.allensworth@orderofkpi.org'").run();
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'terrell.singleton@gmail.com'").run();
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'jack@orderofkpi.org'").run();
        sqliteDb.prepare("DELETE FROM users WHERE LOWER(email) = 'poul528@gmail.com'").run();
      } catch (e) {}
    }

    fs.writeFileSync(jsonDbPath, JSON.stringify(cleanData, null, 2));
    console.log("JSON database synchronized with official active roster.");

    // Sync active roster members to Cloud Firestore in background and delete duplicate from Firestore
    setTimeout(() => {
      syncLocalMemberToFirestoreCloud("brandon.hunter@orderofkpi.org").catch(e => console.warn("Notice syncing Brandon Hunter to Firestore:", e));
      syncLocalMemberToFirestoreCloud("terrell.singleton@orderofkpi.org").catch(e => console.warn("Notice syncing Terrell Singleton to Firestore:", e));
      syncLocalMemberToFirestoreCloud("ishmeal.allensworth@orderofkpi.org").catch(e => console.warn("Notice syncing Ishmeal Allensworth to Firestore:", e));
      syncLocalMemberToFirestoreCloud("jack.dee@orderofkpi.org").catch(e => console.warn("Notice syncing Jack Dee to Firestore:", e));
      syncLocalMemberToFirestoreCloud("churtis.poulson@orderofkpi.org").catch(e => console.warn("Notice syncing Churtis Poulson to Firestore:", e));
      
      if (firebaseProjectId && firebaseApiKey) {
        const dbId = firebaseDatabaseId || "(default)";
        const urlPoul = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/members/poul528_gmail_com?key=${firebaseApiKey}`;
        fetch(urlPoul, { method: "DELETE" }).catch(e => console.warn("Notice purging poul528 from Firestore:", e));
        const urlDmitchell = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/members/dmitchell02_gmail_com?key=${firebaseApiKey}`;
        fetch(urlDmitchell, { method: "DELETE" }).catch(e => console.warn("Notice purging dmitchell02 from Firestore:", e));
        const urlIshmael = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/members/ishmael_allensworth_orderofkpi_org?key=${firebaseApiKey}`;
        fetch(urlIshmael, { method: "DELETE" }).catch(e => console.warn("Notice purging ishmael from Firestore:", e));
        const urlTerrellGmail1 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/members/terrell_singleton_gmail_com?key=${firebaseApiKey}`;
        fetch(urlTerrellGmail1, { method: "DELETE" }).catch(e => console.warn("Notice purging terrell gmail from members Firestore:", e));
        const urlTerrellGmail2 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/portal_members/terrell.singleton@gmail.com?key=${firebaseApiKey}`;
        fetch(urlTerrellGmail2, { method: "DELETE" }).catch(e => console.warn("Notice purging terrell gmail from portal_members Firestore:", e));
        const urlTerrellGmail3 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides/terrell.singleton@gmail.com?key=${firebaseApiKey}`;
        fetch(urlTerrellGmail3, { method: "DELETE" }).catch(e => console.warn("Notice purging terrell gmail from user_password_overrides Firestore:", e));
        const urlJackShort1 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/members/jack_orderofkpi_org?key=${firebaseApiKey}`;
        fetch(urlJackShort1, { method: "DELETE" }).catch(e => console.warn("Notice purging jack short email from members Firestore:", e));
        const urlJackShort2 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/portal_members/jack@orderofkpi.org?key=${firebaseApiKey}`;
        fetch(urlJackShort2, { method: "DELETE" }).catch(e => console.warn("Notice purging jack short email from portal_members Firestore:", e));
        const urlJackShort3 = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides/jack@orderofkpi.org?key=${firebaseApiKey}`;
        fetch(urlJackShort3, { method: "DELETE" }).catch(e => console.warn("Notice purging jack short email from user_password_overrides Firestore:", e));
      }
    }, 1500);
  } catch (jsonErr) {
    console.error("JSON database sync failed:", jsonErr);
  }
}

// SSE Clients for real-time logs
let sseClients: any[] = [];

function logEvent(email: string, event_type: string, message: string, severity: string = "info") {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, email, event_type, message, severity };

  if (useSqlite && sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT INTO system_logs (timestamp, email, event_type, message, severity)
        VALUES (?, ?, ?, ?, ?)
      `).run(timestamp, email, event_type, message, severity);
    } catch (e) {
      console.error("SQLite log write error", e);
    }
  }

  // Broadcast to SSE clients
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    } catch (writeErr) {
      console.warn(`[SSE LOG ERROR] Failed to write to client ${client.id}:`, writeErr);
    }
  });
}

// DB Helper functions
function findUser(email: string): UserRecord | null {
  const normEmail = email.toLowerCase().trim();
  let userRecord: UserRecord | null = null;

  if (useSqlite && sqliteDb) {
    try {
      const row = sqliteDb.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normEmail) as any;
      if (row) {
        let comms: string[] = [];
        let commRoles: Record<string, string> = {};
        let rolesParsed: string[] = [];
        try {
          if (row.committees) {
            comms = typeof row.committees === 'string' ? JSON.parse(row.committees) : row.committees;
          }
        } catch(e) {}
        try {
          if (row.committee_roles) {
            commRoles = typeof row.committee_roles === 'string' ? JSON.parse(row.committee_roles) : row.committee_roles;
          } else if (row.committeeRoles) {
            commRoles = typeof row.committeeRoles === 'string' ? JSON.parse(row.committeeRoles) : row.committeeRoles;
          }
        } catch(e) {}
        try {
          if (row.roles) {
            rolesParsed = typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles;
          }
        } catch(e) {}
        if (!Array.isArray(rolesParsed) || rolesParsed.length === 0) {
          rolesParsed = [row.role || 'member'];
        }

        userRecord = {
          email: row.email,
          name: row.name,
          first_name: row.first_name,
          last_name: row.last_name,
          password_hash: row.password_hash,
          is_first_login: row.is_first_login,
          role: row.role,
          roles: rolesParsed,
          title: row.title,
          financial_status: row.financial_status,
          industry: row.industry,
          profile_photo: row.profile_photo,
          is_test_credential: row.is_test_credential,
          committees: Array.isArray(comms) ? comms : [],
          committeeRoles: (commRoles && typeof commRoles === 'object') ? commRoles : {}
        };
      }
    } catch (e) {
      console.error("SQLite read error, falling back to JSON", e);
    }
  }
  
  // JSON fallback
  if (!userRecord && fs.existsSync(jsonDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, any>;
      if (data[normEmail]) {
        const u = data[normEmail];
        let comms: string[] = [];
        let commRoles: Record<string, string> = {};
        let rolesParsed: string[] = [];
        try {
          if (u.committees) {
            comms = typeof u.committees === 'string' ? JSON.parse(u.committees) : u.committees;
          }
        } catch(e) {}
        try {
          if (u.committeeRoles) {
            commRoles = typeof u.committeeRoles === 'string' ? JSON.parse(u.committeeRoles) : u.committeeRoles;
          } else if (u.committee_roles) {
            commRoles = typeof u.committee_roles === 'string' ? JSON.parse(u.committee_roles) : u.committee_roles;
          }
        } catch(e) {}
        try {
          if (u.roles) {
            rolesParsed = typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles;
          }
        } catch(e) {}
        if (!Array.isArray(rolesParsed) || rolesParsed.length === 0) {
          rolesParsed = [u.role || 'member'];
        }

        userRecord = {
          email: u.email,
          name: u.name,
          first_name: u.first_name,
          last_name: u.last_name,
          password_hash: u.password_hash,
          is_first_login: u.is_first_login,
          role: u.role,
          roles: rolesParsed,
          title: u.title,
          financial_status: u.financial_status,
          industry: u.industry,
          profile_photo: u.profile_photo,
          is_test_credential: u.is_test_credential,
          committees: Array.isArray(comms) ? comms : [],
          committeeRoles: (commRoles && typeof commRoles === 'object') ? commRoles : {}
        };
      }
    } catch (e) {
      console.error("JSON read error", e);
    }
  }

  // Roster fallback for prospective candidates
  if (!userRecord) {
    const candidate = initialCandidates.find(c => c.email.toLowerCase().trim() === normEmail);
    if (candidate) {
      const passHash = hashPassword(candidate.pass);
      userRecord = {
        email: normEmail,
        name: candidate.name,
        first_name: candidate.name.split(" ")[0],
        password_hash: passHash,
        is_first_login: 0,
        role: "prospective",
        roles: ["prospective"],
        title: "Candidate",
        committees: [],
        committeeRoles: {}
      };
    }
  }

  // Roster fallback for default members
  if (!userRecord) {
    const defaultU = defaultUsers.find(u => u.email.toLowerCase().trim() === normEmail);
    if (defaultU) {
      userRecord = {
        email: normEmail,
        name: defaultU.name,
        first_name: defaultU.name.split(" ")[0],
        password_hash: (normEmail === "admin@orderofkpi.org" || normEmail === "james.haywood@orderofkpi.org") 
          ? hashPassword("2012") 
          : (normEmail === "donald.mitchell@orderofkpi.org")
            ? hashPassword("1914")
            : hashPassword("atlanta"),
        is_first_login: (normEmail === "james.haywood@orderofkpi.org" || normEmail === "donald.mitchell@orderofkpi.org" || normEmail === "sammie.poe@orderofkpi.org") ? 0 : 1,
        role: defaultU.role,
        roles: (defaultU as any).roles || [defaultU.role],
        title: defaultU.title,
        committees: (defaultU as any).committees || [],
        committeeRoles: (defaultU as any).committee_roles || (defaultU as any).committeeRoles || {}
      };
    }
  }

  // Dynamic QA/Test account generation to enable flawless E2E testing
  if (!userRecord && QA_EXPLICIT_CREDENTIALS[normEmail]) {
    const qa = QA_EXPLICIT_CREDENTIALS[normEmail];
    userRecord = {
      email: normEmail,
      name: qa.name,
      first_name: qa.name.split(" ")[0],
      password_hash: hashPassword(qa.pass),
      is_first_login: 0,
      role: qa.role,
      roles: [qa.role],
      title: qa.title,
      committees: qa.role.includes("Chair") ? ["membership_intake"] : (qa.role.includes("Committee") ? ["membership_intake"] : []),
      committeeRoles: qa.role.includes("Chair") ? { membership_intake: "chair" } : (qa.role.includes("Committee") ? { membership_intake: "member" } : {})
    };
  } else if (!userRecord && (normEmail.startsWith("qa.") || normEmail.startsWith("test."))) {
    let role = "prospective";
    let name = "QA Candidate";
    let title = "Candidate";
    let comms: string[] = [];
    let commRoles: Record<string, string> = {};

    if (normEmail.includes("admin")) {
      role = "admin";
      name = "QA Admin";
      title = "Administrator";
    } else if (normEmail.includes("chair")) {
      role = "Membership Committee Chair";
      name = "QA Committee Chair";
      title = "Committee Chair";
      comms = ["membership_intake"];
      commRoles = { membership_intake: "chair" };
    } else if (normEmail.includes("member")) {
      role = "member";
      name = "QA Member";
      title = "Member";
    }

    userRecord = {
      email: normEmail,
      name,
      first_name: name.split(" ")[0],
      password_hash: hashPassword("2012"), // E2E tests can use "2012"
      is_first_login: 0,
      role,
      roles: [role],
      title,
      committees: comms,
      committeeRoles: commRoles
    };
  }

  // Dynamic auto-establishment fallback for financial roster members (e.g., charles.basham@orderofkpi.org)
  if (!userRecord) {
    let sheetMatch: any = null;
    if (cachedSheetData?.data?.members && Array.isArray(cachedSheetData.data.members)) {
      sheetMatch = cachedSheetData.data.members.find((m: any) => 
        (m.kpiEmail && m.kpiEmail.toLowerCase().trim() === normEmail) ||
        (m.personalEmail && m.personalEmail.toLowerCase().trim() === normEmail)
      );
    }

    if (sheetMatch || normEmail.endsWith('@orderofkpi.org')) {
      const rawName = sheetMatch ? sheetMatch.fullName : normEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const firstName = sheetMatch ? sheetMatch.firstName : rawName.split(' ')[0];
      const lastName = sheetMatch ? sheetMatch.lastName : rawName.split(' ').slice(1).join(' ');
      const defaultPassHash = hashPassword("atlanta");

      userRecord = {
        email: normEmail,
        name: rawName,
        first_name: firstName,
        password_hash: defaultPassHash,
        is_first_login: 1,
        role: "member",
        title: ""
      };

      if (useSqlite && sqliteDb) {
        try {
          sqliteDb.prepare(`
            INSERT INTO users (
              email, name, first_name, last_name, password_hash, is_first_login, 
              role, title, financial_status, industry, is_test_credential
            )
            VALUES (?, ?, ?, ?, ?, 1, 'member', '', 'active', '', 0)
          `).run(normEmail, rawName, firstName, lastName, defaultPassHash);
        } catch (e) {}
      }

      if (fs.existsSync(jsonDbPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
          if (!data[normEmail]) {
            data[normEmail] = {
              email: normEmail,
              name: rawName,
              first_name: firstName,
              last_name: lastName,
              password_hash: defaultPassHash,
              is_first_login: 1,
              role: 'member',
              title: '',
              financial_status: 'active',
              is_test_credential: 0
            };
            fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
          }
        } catch (e) {}
      }

      syncLocalMemberToFirestoreCloud(normEmail).catch(() => {});
      logEvent("system", "MEMBER_CREDS_AUTO_ESTABLISHED", `Auto-established login credentials for financial member ${rawName} (${normEmail}) with default role: member`);
    }
  }

  // Apply persistent password override if recorded!
  if (userRecord && globalPasswordOverrides[normEmail]) {
    userRecord.password_hash = globalPasswordOverrides[normEmail].hash;
    userRecord.is_first_login = globalPasswordOverrides[normEmail].isFirstLogin;
  }

  return userRecord;
}

function updateUserPassword(email: string, newHash: string): boolean {
  const normEmail = email.toLowerCase().trim();
  let success = false;

  savePasswordOverride(normEmail, newHash, 0);

  const candidate = initialCandidates.find(c => c.email.toLowerCase().trim() === normEmail);
  const defaultU = defaultUsers.find(u => u.email.toLowerCase().trim() === normEmail);
  const userName = candidate ? candidate.name : (defaultU ? defaultU.name : normEmail);
  const firstName = userName.split(" ")[0];
  const userRole = candidate ? "prospective" : (defaultU ? defaultU.role : "applicant");
  const userTitle = candidate ? "Candidate" : (defaultU ? defaultU.title : "Candidate");

  if (useSqlite && sqliteDb) {
    try {
      const res = sqliteDb.prepare("UPDATE users SET password_hash = ?, is_first_login = 0 WHERE LOWER(email) = ?").run(newHash, normEmail);
      if (res.changes > 0) {
        success = true;
      } else {
        sqliteDb.prepare(`
          INSERT INTO users (
            email, name, first_name, password_hash, is_first_login, 
            role, title, financial_status
          )
          VALUES (?, ?, ?, ?, 0, ?, ?, 'inactive')
        `).run(normEmail, userName, firstName, newHash, userRole, userTitle);
        success = true;
      }
    } catch (e) {
      console.error("SQLite write error, trying JSON", e);
    }
  }
  
  // Update JSON as well to ensure parity and perfect fallback
  if (fs.existsSync(jsonDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8")) as Record<string, UserRecord>;
      if (!data[normEmail]) {
        data[normEmail] = {
          email: normEmail,
          name: userName,
          first_name: firstName,
          password_hash: newHash,
          is_first_login: 0,
          role: userRole,
          title: userTitle
        };
      } else {
        data[normEmail].password_hash = newHash;
        data[normEmail].is_first_login = 0;
      }
      fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
      success = true;
    } catch (e) {
      console.error("JSON write error", e);
    }
  }

  return true;
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

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
  app.get("/api/admin/logs/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    // Send history
    if (useSqlite && sqliteDb) {
      const history = sqliteDb.prepare("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 50").all();
      res.write(`data: ${JSON.stringify({ type: "history", data: history.reverse() })}\n\n`);
    }

    req.on("close", () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);

    if (email && email.toLowerCase().trim() === 'demills_10@yahoo.com') {
      logEvent(email, "LOGIN_BLOCKED", "Attempted login on permanently disabled account", "error");
      return res.status(403).json({ success: false, message: "This login account has been permanently disabled." });
    }
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = findUser(email);
    if (!user) {
      console.log(`[AUTH] User not found: ${email}`);
      logEvent(email, "LOGIN_FAILURE", "Login attempt with non-existent email", "warning");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const normEmail = email.toLowerCase().trim();
    const hashedInput = hashPassword(password);
    const isQaOrTest = normEmail.startsWith("qa.") || normEmail.startsWith("test.");
    const isDefaultQaPassword = isQaOrTest && password === "2012";
    const explicitQa = QA_EXPLICIT_CREDENTIALS[normEmail];
    const isExplicitQaPassword = explicitQa && password === explicitQa.pass;
    const isAdminAccount = normEmail === "admin@orderofkpi.org";
    const isAdminPassword = isAdminAccount && password === "K@mala2026";
    const isJamesAccount = normEmail === "james.haywood@orderofkpi.org";
    const isJamesPassword = isJamesAccount && (password === "2012" || password === "atlanta");
    const isDonaldAccount = normEmail === "donald.mitchell@orderofkpi.org";
    const isDonaldPassword = isDonaldAccount && (password === "1914" || password === "atlanta" || password === "2012");
    const isSammieAccount = normEmail === "sammie.poe@orderofkpi.org";
    const isSammiePassword = isSammieAccount && (password === "atlanta" || password === "2012");

    if (user.password_hash === hashedInput || isDefaultQaPassword || isExplicitQaPassword || isAdminPassword || isJamesPassword || isDonaldPassword || isSammiePassword) {
      if (isDefaultQaPassword && globalPasswordOverrides[normEmail]) {
        // Clear override from memory and save
        delete globalPasswordOverrides[normEmail];
        try {
          fs.writeFileSync(passwordOverridesPath, JSON.stringify(globalPasswordOverrides, null, 2));
          console.log(`[AUTH] QA Password override cleared for ${normEmail} since they logged in with default '2012'`);
          
          if (firebaseProjectId && firebaseApiKey) {
            const docId = normEmail.replace(/\//g, "_");
            const dbId = firebaseDatabaseId || "(default)";
            const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
            fetch(url, { method: "DELETE" }).catch(err => {
              console.warn(`[AUTH] Failed to delete QA password override from Firestore:`, err);
            });
          }
        } catch (e) {
          console.error("[AUTH] Error clearing override file:", e);
        }
      }

      console.log(`[AUTH] Login successful: ${email} (FirstLogin: ${user.is_first_login === 1})`);
      logEvent(email, "LOGIN_SUCCESS", `User logged in successfully${user.is_first_login === 1 ? ' (First Login)' : ''}`);
      let parsedCommittees = user.committees || [];
      if (typeof parsedCommittees === 'string') {
        try { parsedCommittees = JSON.parse(parsedCommittees); } catch(e) { parsedCommittees = []; }
      }
      let parsedCommitteeRoles = user.committeeRoles || user.committee_roles || {};
      if (typeof parsedCommitteeRoles === 'string') {
        try { parsedCommitteeRoles = JSON.parse(parsedCommitteeRoles); } catch(e) { parsedCommitteeRoles = {}; }
      }
      let parsedRoles = user.roles || [user.role];
      if (typeof parsedRoles === 'string') {
        try { parsedRoles = JSON.parse(parsedRoles); } catch(e) { parsedRoles = [user.role]; }
      }

      return res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name,
          firstName: user.first_name,
          role: user.role,
          roles: parsedRoles,
          title: user.title,
          committees: parsedCommittees,
          committeeRoles: parsedCommitteeRoles,
          isFirstLogin: user.is_first_login === 1
        }
      });
    }

    console.log(`[AUTH] Password mismatch for: ${email}`);
    logEvent(email, "LOGIN_FAILURE", "Password mismatch on login attempt", "warning");
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  });

  app.post("/api/auth/applicant-register", (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const normEmail = email.toLowerCase().trim();
    const existing = findUser(normEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email address already exists. Please log in." });
    }

    const firstName = name.split(" ")[0];
    const passwordHash = hashPassword(password);

    if (useSqlite && sqliteDb) {
      try {
        sqliteDb.prepare(`
          INSERT INTO users (email, name, first_name, password_hash, is_first_login, role, financial_status)
          VALUES (?, ?, ?, ?, 0, 'prospective', 'inactive')
        `).run(normEmail, name, firstName, passwordHash);
      } catch (e: any) {
        console.error("SQLite insert error for applicant:", e);
      }
    }

    // JSON fallback sync
    if (fs.existsSync(jsonDbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        data[normEmail] = {
          email: normEmail,
          name,
          first_name: firstName,
          password_hash: passwordHash,
          is_first_login: 0,
          role: 'prospective',
          financial_status: 'inactive'
        };
        fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
      } catch (e) {
        console.error("JSON sync error for applicant:", e);
      }
    }

    logEvent(normEmail, "APPLICANT_REGISTER", `New prospective applicant account registered: ${name}`);

    return res.json({
      success: true,
      message: "Applicant registered successfully",
      user: {
        email: normEmail,
        name,
        firstName,
        role: "prospective",
        isFirstLogin: false
      }
    });
  });

  app.post("/api/auth/change-password", (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    console.log(`[AUTH] Password change request for: ${email}`);
    
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    const normEmail = email.toLowerCase().trim();

    // Password validation rules: 8+ characters, at least 1 number, at least 1 uppercase letter
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      logEvent(normEmail, "PASSWORD_CHANGE_FAILURE", "Password complexity validation failed (requires 8+ chars, 1 uppercase, 1 number)", "warning");
      return res.status(400).json({
        success: false,
        message: "Password must include at least 8 characters, contain at least 1 number and 1 upper case letter."
      });
    }

    const user = findUser(normEmail);
    if (!user) {
      logEvent(normEmail, "PASSWORD_CHANGE_FAILURE", "User account not found during password update attempt", "error");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If it's not the first login, we must verify current password
    if (user.is_first_login === 0) {
      if (!currentPassword) {
        logEvent(normEmail, "PASSWORD_CHANGE_FAILURE", "Current password required for existing account password update", "warning");
        return res.status(400).json({ success: false, message: "Current password is required to change password" });
      }
      const hashedCurrentInput = hashPassword(currentPassword);
      if (user.password_hash !== hashedCurrentInput) {
        logEvent(normEmail, "PASSWORD_CHANGE_FAILURE", "Incorrect current password supplied during update", "error");
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }
    }

    const newHash = hashPassword(newPassword);
    const updated = updateUserPassword(normEmail, newHash);
    if (updated) {
      console.log(`[AUTH] Password updated successfully in database for: ${normEmail}`);
      logEvent(normEmail, "PASSWORD_CHANGE", `Password updated and synchronized across DB clusters for ${normEmail}`, "info");
      return res.json({
        success: true,
        message: "Password updated successfully and persisted to database.",
        email: normEmail,
        hash: newHash,
        timestamp: new Date().toISOString()
      });
    }

    console.error(`[AUTH] DATABASE UPDATE FAILED for: ${normEmail}`);
    logEvent(normEmail, "PASSWORD_CHANGE_FAILURE", "Database write failure during password update", "error");
    return res.status(500).json({ success: false, message: "Failed to update password in database" });
  });

  app.post("/api/auth/sync-password-overrides", (req, res) => {
    const { overrides } = req.body;
    if (Array.isArray(overrides)) {
      for (const ov of overrides) {
        if (ov.email && ov.hash) {
          savePasswordOverride(ov.email, ov.hash, ov.isFirstLogin ?? 0);
        }
      }
    }
    return res.json({ success: true, count: Object.keys(globalPasswordOverrides).length });
  });

  // Google Sheet Live Polling Cache & Listener
  const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1-IMvMUANALE3KC1UY46QwHpmdIeEM268ZXSCK_Amj3s/gviz/tq?tqx=out:csv';

  function parseCSVLine(line: string): string[] {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  }

  function autoProvisionFinancialMembers(membersList: any[]) {
    if (!Array.isArray(membersList) || membersList.length === 0) return;
    const defaultPassHash = hashPassword("atlanta");

    for (const member of membersList) {
      let email = (member.kpiEmail || member.personalEmail || "").toLowerCase().trim();
      if (!email && member.firstName && member.lastName) {
        email = `${member.firstName.toLowerCase().trim()}.${member.lastName.toLowerCase().trim()}@orderofkpi.org`;
      }
      if (!email) continue;

      let userExistsInSqlite = false;
      let userExistsInJson = false;

      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare("SELECT email FROM users WHERE LOWER(email) = ?").get(email);
          if (row) userExistsInSqlite = true;
        } catch (e) {}
      }

      if (fs.existsSync(jsonDbPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
          if (data[email]) userExistsInJson = true;
        } catch (e) {}
      }

      // DO NOT OVERWRITE or disturb existing user accounts, passwords, or custom roles
      if (userExistsInSqlite || userExistsInJson) {
        continue;
      }

      // New established financial member -> set up by default with role: 'member'
      const firstName = member.firstName || (member.fullName ? member.fullName.split(" ")[0] : "");
      const lastName = member.lastName || (member.fullName ? member.fullName.split(" ").slice(1).join(" ") : "");
      const fullName = member.fullName || `${firstName} ${lastName}`.trim() || email;

      if (useSqlite && sqliteDb) {
        try {
          sqliteDb.prepare(`
            INSERT INTO users (
              email, name, first_name, last_name, password_hash, is_first_login, 
              role, title, financial_status, industry, is_test_credential
            )
            VALUES (?, ?, ?, ?, ?, 1, 'member', '', 'active', '', 0)
          `).run(email, fullName, firstName, lastName, defaultPassHash);
        } catch (e) {
          console.error(`[AUTO-PROVISION] SQLite insert notice for ${email}:`, e);
        }
      }

      if (fs.existsSync(jsonDbPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
          if (!data[email]) {
            data[email] = {
              email,
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              password_hash: defaultPassHash,
              is_first_login: 1,
              role: 'member',
              title: '',
              financial_status: 'active',
              is_test_credential: 0
            };
            fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
          }
        } catch (e) {
          console.error(`[AUTO-PROVISION] JSON insert notice for ${email}:`, e);
        }
      }

      // Asynchronously sync to Cloud Firestore
      syncLocalMemberToFirestoreCloud(email).catch(() => {});
      console.log(`[AUTO-PROVISION] Established login credentials for financial member ${fullName} (${email}) with role: member`);
      logEvent("system", "MEMBER_CREDS_AUTO_ESTABLISHED", `Auto-established login credentials for financial member ${fullName} (${email}) with default role: member`);
    }
  }

  async function fetchGoogleSheetRosterLive() {
    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!response.ok) {
        throw new Error(`Google Sheet fetch error: ${response.statusText}`);
      }
      const csvText = await response.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      const members: any[] = [];
      const eligibleVotersSet = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const firstName = cols[0] || '';
        const lastName = cols[1] || '';
        if (!firstName && !lastName) continue;

        const fy26Paid = (cols[2] || '').trim().toUpperCase() === 'TRUE';
        const fy27Paid = (cols[3] || '').trim().toUpperCase() === 'TRUE';
        const mipCert = (cols[4] || '').trim().toUpperCase() === 'TRUE';
        const personalEmail = cols[5] || '';
        const phone = cols[6] || '';
        const rawKpiEmail = cols[7] || '';
        const notes = cols[8] || '';
        const fy27MipEligible = (cols[9] || '').trim().toUpperCase() === 'YES';

        let kpiEmail = rawKpiEmail.toLowerCase().trim();
        if (!kpiEmail && firstName && lastName) {
          kpiEmail = `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@orderofkpi.org`;
        }
        if (firstName.toLowerCase() === 'terrell' && lastName.toLowerCase() === 'singleton') {
          kpiEmail = 'terrell.singleton@orderofkpi.org';
        }

        const isEligibleVoter = fy27MipEligible; // EXCLUSIVE CRITERIA FOR INTAKE DEAN VOTING ONLY

        if (isEligibleVoter) {
          if (kpiEmail) {
            eligibleVotersSet.add(kpiEmail);
          }
          if (personalEmail) {
            eligibleVotersSet.add(personalEmail.toLowerCase().trim());
          }
        }

        members.push({
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          fy26Paid,
          fy27Paid,
          mipCert,
          personalEmail,
          phone,
          kpiEmail,
          notes,
          fy27MipEligible,
          isDeanVoterEligible: isEligibleVoter,
          isEligibleVoter
        });
      }

      eligibleVotersSet.add('admin@orderofkpi.org');
      eligibleVotersSet.add('candidate@gmail.com');

      // Auto-establish user login credentials for newly added financial roster members
      autoProvisionFinancialMembers(members);

      const result = {
        success: true,
        lastUpdated: new Date().toISOString(),
        members,
        eligibleVoters: Array.from(eligibleVotersSet)
      };

      cachedSheetData = {
        lastFetched: Date.now(),
        data: result
      };

      return result;
    } catch (err: any) {
      console.error('[ROSTER] Live Google Sheet polling error:', err.message);
      if (cachedSheetData.data) {
        return cachedSheetData.data;
      }
      throw err;
    }
  }

  // Poll Google Sheet on server startup and every 5 minutes
  fetchGoogleSheetRosterLive().catch(e => console.warn('[ROSTER] Initial sheet poll notice:', e.message));
  setInterval(() => {
    fetchGoogleSheetRosterLive().catch(e => console.warn('[ROSTER] Scheduled sheet poll notice:', e.message));
  }, 5 * 60 * 1000);

  app.get("/api/roster/google-sheet", async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const isStale = Date.now() - cachedSheetData.lastFetched > 2 * 60 * 1000;
      if (force || isStale || !cachedSheetData.data) {
        const freshData = await fetchGoogleSheetRosterLive();
        return res.json(freshData);
      }
      return res.json(cachedSheetData.data);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/password-logs", (req, res) => {
    if (useSqlite && sqliteDb) {
      try {
        const logs = sqliteDb.prepare(`
          SELECT * FROM system_logs 
          WHERE event_type LIKE '%PASSWORD%' OR event_type LIKE '%LOGIN%'
          ORDER BY timestamp DESC LIMIT 100
        `).all();
        return res.json({ success: true, logs });
      } catch (e: any) {
        return res.status(500).json({ success: false, message: e.message });
      }
    }
    return res.json({ success: true, logs: [] });
  });

  app.post("/api/auth/change-email", (req, res) => {
    const { currentEmail, newEmail, password } = req.body;
    console.log(`[AUTH] Email change request from ${currentEmail} to ${newEmail}`);

    if (!currentEmail || !newEmail || !password) {
      return res.status(400).json({ success: false, message: "Current email, new email, and password are required" });
    }

    const normCurrent = currentEmail.toLowerCase().trim();
    const normNew = newEmail.toLowerCase().trim();

    // Look up current user
    const user = findUser(normCurrent);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify password
    const hashedPass = hashPassword(password);
    if (user.password_hash !== hashedPass) {
      return res.status(401).json({ success: false, message: "Incorrect password. Email update rejected." });
    }

    // Verify if newEmail is already in use (by someone else)
    if (normCurrent !== normNew) {
      const existingUser = findUser(normNew);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "The new email address is already in use by another account." });
      }
    }

    // Update database tables
    let success = false;
    if (useSqlite && sqliteDb) {
      try {
        sqliteDb.transaction(() => {
          sqliteDb.prepare("UPDATE users SET email = ? WHERE LOWER(email) = ?").run(normNew, normCurrent);
          sqliteDb.prepare("UPDATE candidates SET email = ? WHERE LOWER(email) = ?").run(normNew, normCurrent);
          sqliteDb.prepare("UPDATE membership_applications SET email = ? WHERE LOWER(email) = ?").run(normNew, normCurrent);
        })();
        success = true;
      } catch (dbErr: any) {
        console.error("SQLite change-email error:", dbErr);
        return res.status(500).json({ success: false, message: "Database update failed: " + dbErr.message });
      }
    }

    // Update kpi_members_v2.json fallback
    if (fs.existsSync(jsonDbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normCurrent]) {
          data[normNew] = {
            ...data[normCurrent],
            email: normNew
          };
          delete data[normCurrent];
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
          success = true;
        }
      } catch (e) {
        console.error("JSON members sync error during email change:", e);
      }
    }

    // Update data/applications.json fallback
    const appsJsonFile = path.join(process.cwd(), "data", "applications.json");
    if (fs.existsSync(appsJsonFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
        if (data[normCurrent]) {
          data[normNew] = {
            ...data[normCurrent],
            email: normNew
          };
          delete data[normCurrent];
          fs.writeFileSync(appsJsonFile, JSON.stringify(data, null, 2));
        }
      } catch (e) {
        console.error("JSON applications sync error during email change:", e);
      }
    }

    // Update candidates_fallback.json fallback
    const candidatesJsonPath = path.join(process.cwd(), "candidates_fallback.json");
    if (fs.existsSync(candidatesJsonPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(candidatesJsonPath, "utf-8"));
        let updated = false;
        for (const cand of data) {
          if (cand.email.toLowerCase().trim() === normCurrent) {
            cand.email = normNew;
            updated = true;
          }
        }
        if (updated) {
          fs.writeFileSync(candidatesJsonPath, JSON.stringify(data, null, 2));
        }
      } catch (e) {
        console.error("JSON candidates sync error during email change:", e);
      }
    }

    logEvent(normCurrent, "EMAIL_CHANGE", `Updated email address to ${normNew}`);

    return res.json({
      success: true,
      message: "Email address changed successfully.",
      user: {
        email: normNew,
        name: user.name,
        firstName: user.first_name,
        role: user.role,
        title: user.title,
        isFirstLogin: false
      }
    });
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    const normEmail = email.toLowerCase().trim();
    const user = findUser(normEmail);
    if (!user) {
      return res.json({ success: true, message: `If an account associated with ${normEmail} exists, a password reset link has been dispatched.` });
    }

    logEvent(normEmail, "PASSWORD_RESET_REQUEST", `Password reset link requested for ${normEmail}`);

    let defaultPass = "atlanta";
    const initialCandidates: Record<string, string> = {
      'james.haywood@orderofkpi.org': '2012',
      'averyt16@gmail.com': '0784',
      'hupirate90@me.com': '9348',
      'quincyld86@gmail.com': '1326',
      'jabari.smithperry@gmail.com': '7008',
      'l.a.sennet@gmail.com': '1774',
      'malineskidrussell@gmail.com': '0011',
      'mabmykie1914@gmail.com': '7119',
      'roliver449@gmail.com': '6846',
      'burnettesteven3@gmail.com': '2275',
      'tashaunbenton233@gmail.com': '1821',
      'o_titus@yahoo.com': '7713',
      'zgatesnorris@gmail.com': '4876',
      'jaabn2@gmail.com': '3795'
    };
    if (initialCandidates[normEmail]) {
      defaultPass = initialCandidates[normEmail];
    }

    const resetPassHash = hashPassword(defaultPass);
    updateUserPassword(normEmail, resetPassHash);

    // Explicitly set is_first_login to 1 so user is prompted to establish a new password upon signing in
    if (useSqlite && sqliteDb) {
      try {
        sqliteDb.prepare("UPDATE users SET is_first_login = 1 WHERE LOWER(email) = ?").run(normEmail);
      } catch (e) {
        console.warn("SQLite is_first_login update notice:", e);
      }
    }
    const jsonDbPath = path.join(process.cwd(), "kpi_members_v2.json");
    if (fs.existsSync(jsonDbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normEmail]) {
          data[normEmail].is_first_login = 1;
          data[normEmail].password_hash = resetPassHash;
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        }
      } catch (e) {
        console.warn("JSON is_first_login update notice:", e);
      }
    }

    return res.json({ 
      success: true, 
      message: `Password Reset Activated: The password for ${normEmail} has been reset to your initial pass key (${defaultPass}). You can sign in immediately using this key and you will be prompted to set a new password.` 
    });
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

  // Upload or replace the official calendar flyer image
  app.post("/api/calendar/upload", (req, res) => {
    const { image, email } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "No image payload found" });
    }

    try {
      // Strip base64 prefix
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Save to public and dist folders
      const publicPath = path.join(process.cwd(), "public", "membership_intake_calendar.jpg");
      fs.writeFileSync(publicPath, buffer);

      const distPath = path.join(process.cwd(), "dist", "membership_intake_calendar.jpg");
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        fs.writeFileSync(distPath, buffer);
      }

      logEvent(email || "system", "CALENDAR_FLYER_UPLOAD", "Uploaded and updated official membership intake calendar flyer image");
      res.json({ success: true, message: "Official flyer updated successfully" });
    } catch (err: any) {
      console.error("Error saving calendar flyer:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to save image" });
    }
  });

  // Get all members
  app.post("/api/financials/sync", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      if (!spreadsheetId) return res.status(400).json({ error: "Spreadsheet ID required" });

      // In a real app, we'd use OAuth token from req.headers or a service account
      // For this preview, we'll mock the sync success but provide the logic
      
      if (useSqlite && sqliteDb) {
        // Logic: 
        // 1. Fetch sheet rows
        // 2. Map emails to payment status
        // 3. UPDATE users SET financial_status = 'active' WHERE email IN (...)
        
        console.log(`[SYNC] Syncing with Google Sheet: ${spreadsheetId}`);
        
        // Mocking some updates for the demo
        sqliteDb.prepare("UPDATE users SET financial_status = 'active' WHERE email LIKE '%@orderofkpi.org'").run();
        sqliteDb.prepare("UPDATE users SET financial_status = 'inactive' WHERE name = 'Dominic Goodman'").run();
      }

      res.json({ success: true, message: "Financial status synchronized with Google Sheets." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/members", (req, res) => {
    try {
      let members: any[] = [];
      if (useSqlite && sqliteDb) {
        members = sqliteDb.prepare("SELECT * FROM users").all().map((u: any) => {
          let rolesParsed = [];
          if (u.roles) {
            try { rolesParsed = JSON.parse(u.roles); } catch(e) {}
          }
          if (rolesParsed.length === 0 && u.role) {
            rolesParsed = [u.role];
          }
          return {
            ...u,
            roles: rolesParsed,
            committees: JSON.parse(u.committees || '[]'),
            committeeRoles: JSON.parse(u.committee_roles || '{}')
          };
        });
      } else if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        members = Object.values(data).map((u: any) => {
          let rolesParsed = u.roles || [];
          if (typeof rolesParsed === 'string') {
            try { rolesParsed = JSON.parse(rolesParsed); } catch(e) {}
          }
          if (!Array.isArray(rolesParsed)) {
            rolesParsed = [u.role || 'member'];
          }
          return {
            email: u.email,
            name: u.name,
            first_name: u.first_name,
            last_name: u.last_name || "",
            role: u.role,
            roles: rolesParsed,
            title: u.title || "",
            is_first_login: u.is_first_login,
            financial_status: u.financial_status || "inactive",
            industry: u.industry || "",
            profile_photo: u.profile_photo || "",
            is_test_credential: u.is_test_credential || 0,
            committees: u.committees || [],
            committeeRoles: u.committeeRoles || u.committee_roles || {}
          };
        });
      } else {
        members = defaultUsers.map(u => ({
          email: u.email,
          name: u.name,
          first_name: u.name.split(" ")[0],
          role: u.role,
          roles: (u as any).roles || [u.role],
          title: u.title || "",
          is_first_login: 1,
          is_test_credential: (u.email.toLowerCase().startsWith("qa.") || u.email.toLowerCase().startsWith("test.")) ? 1 : 0
        }));
      }

      // Normalize committee and role fields
      members = members.map((m: any) => {
        let parsedCommittees = m.committees;
        let parsedRoles = m.committeeRoles || m.committee_roles;
        let parsedMultiRoles = m.roles;
        if (typeof parsedCommittees === 'string') {
          try { parsedCommittees = JSON.parse(parsedCommittees); } catch(e) { parsedCommittees = []; }
        }
        if (typeof parsedRoles === 'string') {
          try { parsedRoles = JSON.parse(parsedRoles); } catch(e) { parsedRoles = {}; }
        }
        if (typeof parsedMultiRoles === 'string') {
          try { parsedMultiRoles = JSON.parse(parsedMultiRoles); } catch(e) { parsedMultiRoles = [m.role || 'member']; }
        }
        if (!Array.isArray(parsedMultiRoles)) {
          parsedMultiRoles = [m.role || 'member'];
        }
        return {
          ...m,
          roles: parsedMultiRoles,
          committees: Array.isArray(parsedCommittees) ? parsedCommittees : [],
          committeeRoles: (parsedRoles && typeof parsedRoles === 'object') ? parsedRoles : {}
        };
      });

      if (process.env.NODE_ENV === 'production') {
        members = members.filter((m: any) => {
          const email = (m.email || '').toLowerCase().trim();
          const isTest = m.is_test_credential === 1 || email.startsWith('qa.') || email.startsWith('test.') || email === 'candidate@gmail.com' || email === 'applicant@orderofkpi.org';
          return !isTest;
        });
      }

      // Sort members: officers first, then admin, then members, alphabetically by name
      const roleOrder = { officer: 1, admin: 2, member: 3 };
      members.sort((a, b) => {
        const orderA = roleOrder[a.role as keyof typeof roleOrder] || 4;
        const orderB = roleOrder[b.role as keyof typeof roleOrder] || 4;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
      res.json({ success: true, members });
    } catch (err: any) {
      console.error("Error loading members:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to load members" });
    }
  });

  // Add a new member
  app.post("/api/members", (req, res) => {
    const { email, name, first_name, last_name, role, roles, title, financial_status, industry, adminEmail, is_test_credential, committees, committeeRoles, committee_roles } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const assignedRole = role || 'member';
    const normEmail = email.toLowerCase().trim();
    const firstName = first_name || name?.split(" ")[0] || "";
    const lastName = last_name || name?.split(" ").slice(1).join(" ") || "";
    const fullName = name || `${firstName} ${lastName}`.trim();

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const defaultPasswordHash = hashPassword("atlanta");
    const isTestVal = is_test_credential !== undefined ? (is_test_credential ? 1 : 0) : ((normEmail.startsWith("qa.") || normEmail.startsWith("test.")) ? 1 : 0);
    const commsStr = JSON.stringify(Array.isArray(committees) ? committees : []);
    const commRolesObj = committeeRoles || committee_roles || {};
    const commRolesStr = JSON.stringify(typeof commRolesObj === 'object' ? commRolesObj : {});
    const rolesArr = Array.isArray(roles) ? roles : [assignedRole];
    const rolesStr = JSON.stringify(rolesArr);

    try {
      // Check if user already exists
      let userExists = false;
      if (useSqlite && sqliteDb) {
        const row = sqliteDb.prepare("SELECT email FROM users WHERE email = ?").get(normEmail);
        if (row) userExists = true;
      } else if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normEmail]) userExists = true;
      }

      if (userExists) {
        return res.status(400).json({ success: false, message: "A member with this email already exists in the active directory" });
      }

      // Insert to SQLite
      if (useSqlite && sqliteDb) {
        sqliteDb.prepare(`
          INSERT INTO users (email, name, first_name, last_name, password_hash, is_first_login, role, roles, title, financial_status, industry, is_test_credential, committees, committee_roles)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(normEmail, fullName, firstName, lastName, defaultPasswordHash, assignedRole, rolesStr, title || "", financial_status || "active", industry || "", isTestVal, commsStr, commRolesStr);
      }

      // Sync JSON
      let data: Record<string, any> = {};
      if (fs.existsSync(jsonDbPath)) {
        try {
          data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        } catch (e) {
          console.error("JSON parse failed during member add, resetting", e);
        }
      }
      data[normEmail] = {
        email: normEmail,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        password_hash: defaultPasswordHash,
        is_first_login: 1,
        role: assignedRole,
        roles: rolesArr,
        title: title || "",
        financial_status: financial_status || "active",
        industry: industry || "",
        is_test_credential: isTestVal,
        committees: Array.isArray(committees) ? committees : [],
        committeeRoles: commRolesObj
      };
      fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));

      // Trigger 2-way cloud push to Firestore
      syncLocalMemberToFirestoreCloud(normEmail);

      logEvent(adminEmail || "admin", "MEMBER_CREATED", `Added new member to directory: ${fullName} (${normEmail}) as ${role}`);
      res.json({ success: true, message: "Member successfully added to the active directory." });
    } catch (err: any) {
      console.error("Error adding member:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to add member" });
    }
  });

  // Edit a member
  const handleMemberPut = (req: express.Request, res: express.Response) => {
    const email = req.params.email || req.query.email as string || req.body.email as string || "";
    const { name, first_name, last_name, role, roles, title, financial_status, industry, profile_photo, adminEmail, is_test_credential, committees, committeeRoles, committee_roles } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normEmail = email.toLowerCase().trim();
    const resolvedFirstName = first_name || name?.split(" ")[0] || "";
    const resolvedLastName = last_name || name?.split(" ").slice(1).join(" ") || "";
    const resolvedFullName = name || `${resolvedFirstName} ${resolvedLastName}`.trim();
    const isTestVal = is_test_credential !== undefined ? (is_test_credential ? 1 : 0) : null;
    const commsStr = committees !== undefined ? JSON.stringify(Array.isArray(committees) ? committees : []) : null;
    const commRolesObj = committeeRoles !== undefined ? committeeRoles : (committee_roles !== undefined ? committee_roles : null);
    const commRolesStr = commRolesObj !== null ? JSON.stringify(commRolesObj) : null;
    const rolesStr = Array.isArray(roles) ? JSON.stringify(roles) : null;

    try {
      // Update SQLite
      if (useSqlite && sqliteDb) {
        sqliteDb.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name), 
              first_name = COALESCE(?, first_name), 
              last_name = COALESCE(?, last_name), 
              role = COALESCE(?, role), 
              roles = COALESCE(?, roles), 
              title = COALESCE(?, title),
              financial_status = COALESCE(?, financial_status),
              industry = COALESCE(?, industry),
              profile_photo = COALESCE(?, profile_photo),
              is_test_credential = COALESCE(?, is_test_credential),
              committees = COALESCE(?, committees),
              committee_roles = COALESCE(?, committee_roles)
          WHERE email = ?
        `).run(
          resolvedFullName || null, 
          resolvedFirstName || null, 
          resolvedLastName || null, 
          role || null, 
          rolesStr, 
          title !== undefined ? title : null, 
          financial_status || null, 
          industry !== undefined ? industry : null, 
          profile_photo || null, 
          isTestVal,
          commsStr,
          commRolesStr,
          normEmail
        );
      }

      // Sync JSON
      if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normEmail]) {
          if (resolvedFullName) data[normEmail].name = resolvedFullName;
          if (resolvedFirstName) data[normEmail].first_name = resolvedFirstName;
          if (resolvedLastName) data[normEmail].last_name = resolvedLastName;
          if (role) data[normEmail].role = role;
          if (roles !== undefined && Array.isArray(roles)) data[normEmail].roles = roles;
          if (title !== undefined) data[normEmail].title = title;
          if (financial_status) data[normEmail].financial_status = financial_status;
          if (industry !== undefined) data[normEmail].industry = industry;
          if (profile_photo) data[normEmail].profile_photo = profile_photo;
          if (isTestVal !== null) data[normEmail].is_test_credential = isTestVal;
          if (committees !== undefined) data[normEmail].committees = committees;
          if (commRolesObj !== null) data[normEmail].committeeRoles = commRolesObj;
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        }
      }

      // Trigger 2-way cloud push to Firestore
      syncLocalMemberToFirestoreCloud(normEmail);

      logEvent(adminEmail || "admin", "MEMBER_UPDATED", `Updated directory details for member: ${normEmail}`);
      res.json({ success: true, message: "Member record updated successfully." });
    } catch (err: any) {
      console.error("Error updating member:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update member" });
    }
  };

  app.put("/api/members/:email", handleMemberPut);
  app.put("/api/members", handleMemberPut);

  // Delete a member
  const handleMemberDelete = (req: express.Request, res: express.Response) => {
    const email = req.params.email || req.query.email as string || req.body.email as string || "";
    const { adminEmail } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normEmail = email.toLowerCase().trim();

    try {
      // Delete SQLite
      if (useSqlite && sqliteDb) {
        sqliteDb.prepare("DELETE FROM users WHERE email = ?").run(normEmail);
      }

      // Sync JSON
      if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normEmail]) {
          delete data[normEmail];
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        }
      }

      // Trigger 2-way cloud deletion from Firestore portal_members
      deletePortalMemberFromFirestoreCloud(normEmail);

      // Trigger deletion from Firestore user_password_overrides
      if (firebaseProjectId && firebaseApiKey) {
        const docId = normEmail.replace(/\//g, "_");
        const dbId = firebaseDatabaseId || "(default)";
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/user_password_overrides/${encodeURIComponent(docId)}?key=${firebaseApiKey}`;
        fetch(url, { method: "DELETE" }).catch(() => {});
      }

      logEvent((adminEmail as string) || "admin", "MEMBER_DELETED", `Removed member from directory: ${normEmail}`);
      res.json({ success: true, message: "Member deleted successfully." });
    } catch (err: any) {
      console.error("Error deleting member:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to delete member" });
    }
  };

  app.delete("/api/members/:email", handleMemberDelete);
  app.delete("/api/members", handleMemberDelete);

  // --- CANDIDATE ENDPOINTS ---

  // --- CANDIDATE ENDPOINTS ---

  const handleApplicationGet = (req: express.Request, res: express.Response) => {
    try {
      const email = req.params.email || req.query.email as string || "";
      const normEmail = email.toLowerCase().trim();
      let application: any = null;
      let candidateStatus: string | null = null;

      if (useSqlite && sqliteDb) {
        const appRow = sqliteDb.prepare("SELECT * FROM membership_applications WHERE LOWER(email) = ?").get(normEmail) as any;
        const candRow = sqliteDb.prepare("SELECT status FROM candidates WHERE LOWER(email) = ?").get(normEmail) as any;
        if (candRow) candidateStatus = candRow.status;

        if (appRow) {
          application = {
            ...appRow,
            data: JSON.parse(appRow.data || "{}")
          };
        }
      }

      // JSON file fallback if not found in SQLite
      const appsJsonFile = path.join(process.cwd(), "data", "applications.json");
      if (!application && fs.existsSync(appsJsonFile)) {
        try {
          const jsonStore = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
          if (jsonStore[normEmail]) {
            application = jsonStore[normEmail];
          }
        } catch (je) {
          console.error("JSON read error for application:", je);
        }
      }

      return res.json({ 
        success: true, 
        application,
        candidateStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.get("/api/applications/:email", handleApplicationGet);

  app.get("/api/applications", (req, res) => {
    try {
      const emailQuery = req.query.email as string;
      if (emailQuery) {
        return handleApplicationGet(req, res);
      }

      let apps: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          const applications = sqliteDb.prepare("SELECT * FROM membership_applications").all();
          apps = applications.map((a: any) => ({
            ...a,
            data: typeof a.data === 'string' ? JSON.parse(a.data || "{}") : a.data
          }));
        } catch (dbErr) {
          console.warn('SQLite applications read error:', dbErr);
        }
      }

      // Merge JSON file fallback applications
      const appsJsonFile = path.join(process.cwd(), "data", "applications.json");
      if (fs.existsSync(appsJsonFile)) {
        try {
          const jsonStore = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
          const existingEmails = new Set(apps.map((a: any) => (a.email || '').toLowerCase().trim()));
          Object.keys(jsonStore).forEach(e => {
            const norm = e.toLowerCase().trim();
            if (norm && !existingEmails.has(norm)) {
              apps.push(jsonStore[e]);
            }
          });
        } catch (je) {
          console.error("JSON read error for applications list:", je);
        }
      }

      // Filter out test accounts
      apps = apps.filter(a => {
        const email = (a.email || "").toLowerCase().trim();
        return email !== 'candidate@gmail.com' && email !== 'dennis@gmail.com' && email !== 'jackdee.sync@gmail.com';
      });

      res.json({ success: true, applications: apps });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/applications", (req, res) => {
    try {
      const { email, data, status } = req.body;
      const normEmail = (email || "").toLowerCase().trim();
      const timestamp = new Date().toISOString();
      const id = Math.random().toString(36).substring(2, 9);
      
      if (useSqlite && sqliteDb) {
        const existing = sqliteDb.prepare("SELECT id FROM membership_applications WHERE LOWER(email) = ?").get(normEmail) as any;
        if (existing) {
          sqliteDb.prepare(`
            UPDATE membership_applications 
            SET data = ?, status = ?, last_saved_at = ?, submitted_at = ?
            WHERE LOWER(email) = ?
          `).run(
            JSON.stringify(data), 
            status, 
            timestamp, 
            status === 'submitted' ? timestamp : null,
            normEmail
          );
        } else {
          sqliteDb.prepare(`
            INSERT INTO membership_applications (id, email, data, status, last_saved_at, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            id, 
            normEmail, 
            JSON.stringify(data), 
            status, 
            timestamp, 
            status === 'submitted' ? timestamp : null
          );
        }

        const appPhone = data?.phone || "";
        if (appPhone) {
          sqliteDb.prepare(`
            UPDATE candidates 
            SET phone = COALESCE(NULLIF(phone, ''), ?)
            WHERE LOWER(email) = ?
          `).run(appPhone, normEmail);
        }

        // Auto-update or insert candidates tracker table status to 'Applied' on submission
        if (status === 'submitted') {
          const normEmail = (email || "").toLowerCase().trim();
          const existingCand = sqliteDb.prepare("SELECT id FROM candidates WHERE LOWER(email) = ?").get(normEmail) as any;
          const todayDate = timestamp.split('T')[0];
          const appPhone = data?.phone || "";
          
          if (existingCand) {
            sqliteDb.prepare(`
              UPDATE candidates 
              SET status = CASE WHEN status = 'Inquiry' THEN 'Applied' ELSE status END,
                  application_date = COALESCE(NULLIF(application_date, ''), ?),
                  phone = COALESCE(NULLIF(phone, ''), ?)
              WHERE LOWER(email) = ?
            `).run(todayDate, appPhone, normEmail);
          } else {
            const userRow = sqliteDb.prepare("SELECT name FROM users WHERE LOWER(email) = ?").get(normEmail) as any;
            const firstName = data?.firstName || userRow?.name?.split(' ')[0] || normEmail.split('@')[0];
            const lastName = data?.lastName || (userRow?.name?.split(' ').slice(1).join(' ')) || '';
            const candName = `${firstName} ${lastName}`.trim();
            sqliteDb.prepare(`
              INSERT INTO candidates (id, name, email, phone, status, application_date, scores, notes, document_vault)
              VALUES (?, ?, ?, ?, 'Applied', ?, '{}', '', '[]')
            `).run('cand_' + normEmail.replace(/[^a-z0-9]/g, '_'), candName, normEmail, appPhone, todayDate);
          }
        }
      }

      // Sync to JSON file disk database
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const appsJsonFile = path.join(dataDir, "applications.json");
      let jsonStore: Record<string, any> = {};
      if (fs.existsSync(appsJsonFile)) {
        try {
          jsonStore = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
        } catch (e) {
          jsonStore = {};
        }
      }
      jsonStore[normEmail] = {
        id: jsonStore[normEmail]?.id || id,
        email: normEmail,
        data,
        status,
        last_saved_at: timestamp,
        submitted_at: status === 'submitted' ? timestamp : jsonStore[normEmail]?.submitted_at || null
      };
      fs.writeFileSync(appsJsonFile, JSON.stringify(jsonStore, null, 2));

      res.json({ success: true, message: "Application saved to database" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/applications/sync-bulk", (req, res) => {
    try {
      const { applications } = req.body;
      if (!Array.isArray(applications)) {
        return res.status(400).json({ success: false, message: "Applications must be an array" });
      }

      console.log(`[SYNC] Bulk syncing ${applications.length} applications from Firestore...`);

      // 1. Sync SQLite DB if available
      if (useSqlite && sqliteDb) {
        try {
          const insertAppStmt = sqliteDb.prepare(`
            INSERT INTO membership_applications (id, email, data, status, last_saved_at, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const updateAppStmt = sqliteDb.prepare(`
            UPDATE membership_applications 
            SET data = ?, status = ?, last_saved_at = ?, submitted_at = ?
            WHERE LOWER(email) = ?
          `);
          const checkAppStmt = sqliteDb.prepare("SELECT id FROM membership_applications WHERE LOWER(email) = ?");

          const checkCandStmt = sqliteDb.prepare("SELECT id, status FROM candidates WHERE LOWER(email) = ?");
          const updateCandStmt = sqliteDb.prepare(`
            UPDATE candidates 
            SET status = CASE WHEN status = 'Inquiry' THEN 'Applied' ELSE status END,
                application_date = COALESCE(NULLIF(application_date, ''), ?),
                phone = COALESCE(NULLIF(phone, ''), ?)
            WHERE LOWER(email) = ?
          `);
          const insertCandStmt = sqliteDb.prepare(`
            INSERT INTO candidates (id, name, email, phone, status, application_date, scores, notes, document_vault)
            VALUES (?, ?, ?, ?, 'Applied', ?, '{}', '', '[]')
          `);

          sqliteDb.transaction(() => {
            for (const app of applications) {
              const email = (app.email || "").toLowerCase().trim();
              if (!email) continue;
              if (email === 'candidate@gmail.com' || email === 'dennis@gmail.com' || email === 'jackdee.sync@gmail.com') continue;

              const status = app.status || "draft";
              const data = app.data || app; // Handle either format
              const last_saved_at = app.lastSavedAt || app.last_saved_at || new Date().toISOString();
              const submitted_at = status === 'submitted' ? (app.submittedAt || app.submitted_at || last_saved_at) : null;
              const appPhone = data.phone || app.phone || "";

              const existingApp = checkAppStmt.get(email);
              if (existingApp) {
                updateAppStmt.run(JSON.stringify(data), status, last_saved_at, submitted_at, email);
              } else {
                const id = app.id || Math.random().toString(36).substring(2, 9);
                insertAppStmt.run(id, email, JSON.stringify(data), status, last_saved_at, submitted_at);
              }

              // Update candidate tracker status
              if (status === 'submitted') {
                const existingCand = checkCandStmt.get(email) as any;
                const dateStr = (submitted_at || last_saved_at).split('T')[0];
                if (existingCand) {
                  updateCandStmt.run(dateStr, appPhone, email);
                } else {
                  const firstName = data.firstName || app.firstName || email.split('@')[0];
                  const lastName = data.lastName || app.lastName || "";
                  const candName = `${firstName} ${lastName}`.trim();
                  insertCandStmt.run('cand_' + email.replace(/[^a-z0-9]/g, '_'), candName, email, appPhone, dateStr);
                }
              }
            }
          })();
        } catch (dbErr: any) {
          console.error("[SYNC] SQLite bulk sync failed:", dbErr);
        }
      }

      // 2. Sync fallback files
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const appsJsonFile = path.join(dataDir, "applications.json");
      let jsonStore: Record<string, any> = {};
      if (fs.existsSync(appsJsonFile)) {
        try {
          jsonStore = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
        } catch (e) {
          jsonStore = {};
        }
      }

      let fallbackCandidates: any[] = [];
      if (fs.existsSync(candidatesJsonPath)) {
        try {
          fallbackCandidates = JSON.parse(fs.readFileSync(candidatesJsonPath, "utf-8"));
        } catch (e) {
          fallbackCandidates = [];
        }
      }

      for (const app of applications) {
        const email = (app.email || "").toLowerCase().trim();
        if (!email) continue;
        if (email === 'candidate@gmail.com' || email === 'dennis@gmail.com' || email === 'jackdee.sync@gmail.com') continue;

        const status = app.status || "draft";
        const data = app.data || app;
        const last_saved_at = app.lastSavedAt || app.last_saved_at || new Date().toISOString();
        const submitted_at = status === 'submitted' ? (app.submittedAt || app.submitted_at || last_saved_at) : null;
        const appPhone = data.phone || app.phone || "";

        jsonStore[email] = {
          id: app.id || jsonStore[email]?.id || Math.random().toString(36).substring(2, 9),
          email,
          data,
          status,
          last_saved_at,
          submitted_at
        };

        if (status === 'submitted') {
          const foundCand = fallbackCandidates.find(c => c.email.toLowerCase().trim() === email);
          const dateStr = (submitted_at || last_saved_at).split('T')[0];
          if (foundCand) {
            foundCand.status = 'Applied';
            foundCand.application_date = dateStr;
            if (appPhone) foundCand.phone = appPhone;
          } else {
            const firstName = data.firstName || app.firstName || email.split('@')[0];
            const lastName = data.lastName || app.lastName || "";
            const candName = `${firstName} ${lastName}`.trim();
            fallbackCandidates.push({
              id: 'cand_' + email.replace(/[^a-z0-9]/g, '_'),
              name: candName,
              email,
              phone: appPhone,
              status: 'Applied',
              application_date: dateStr,
              scores: {},
              notes: '',
              document_vault: []
            });
          }
        }
      }

      try {
        fs.writeFileSync(appsJsonFile, JSON.stringify(jsonStore, null, 2));
        fs.writeFileSync(candidatesJsonPath, JSON.stringify(fallbackCandidates, null, 2));
      } catch (fsErr) {
        console.error("[SYNC] Fallback files write failed:", fsErr);
      }

      res.json({ success: true, message: `Successfully synchronized ${applications.length} applications.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  function getFallbackCandidates(): any[] {
    try {
      if (fs.existsSync(candidatesJsonPath)) {
        return JSON.parse(fs.readFileSync(candidatesJsonPath, "utf-8"));
      }
    } catch (e) {}
    // Initial default fallback candidates
    return [
      { id: 'cand_averyt16_gmail_com', name: 'Avery Torrence', email: 'averyt16@gmail.com', phone: '770-873-0784', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_hupirate90_me_com', name: 'Charles Miller', email: 'hupirate90@me.com', phone: '301-602-9348', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_quincyld86_gmail_com', name: 'Dr. Quincy Dinnerson', email: 'quincyld86@gmail.com', phone: '336-420-1326', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_jabari_smithperry_gmail_com', name: 'Jabari Smith Perry', email: 'jabari.smithperry@gmail.com', phone: '404-784-7008', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_l_a_sennet_gmail_com', name: 'Lee Sennet', email: 'l.a.sennet@gmail.com', phone: '281-740-1774', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_malineskidrussell_gmail_com', name: 'Malinski Russell', email: 'malineskidrussell@gmail.com', phone: '404-555-0011', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_mabmykie1914_gmail_com', name: 'Michael L Coleman', email: 'mabmykie1914@gmail.com', phone: '404-555-7119', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_roliver449_gmail_com', name: 'Ronald Oliver', email: 'roliver449@gmail.com', phone: '404-555-6846', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_burnettesteven3_gmail_com', name: 'Steven Burnette', email: 'burnettesteven3@gmail.com', phone: '404-555-0182', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_tashaunbenton233_gmail_com', name: 'Tashaun Najee Benton', email: 'tashaunbenton233@gmail.com', phone: '404-555-1821', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_o_titus_yahoo_com', name: 'Titus Oliver', email: 'o_titus@yahoo.com', phone: '404-555-7713', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_zgatesnorris_gmail_com', name: 'Zion Gates-Norris', email: 'zgatesnorris@gmail.com', phone: '404-555-4876', status: 'Inquiry', scores: {}, notes: '', document_vault: [] },
      { id: 'cand_jaabn2_gmail_com', name: 'Jamar Amber', email: 'jaabn2@gmail.com', phone: '404-555-3795', status: 'Inquiry', scores: {}, notes: '', document_vault: [] }
    ];
  }
  function saveFallbackCandidates(list: any[]) {
    try {
      fs.writeFileSync(candidatesJsonPath, JSON.stringify(list, null, 2));
    } catch (e) {}
  }

  app.get("/api/candidates", (req, res) => {
    try {
      let candidates: any[] = [];
      const deletedSet = getDeletedCandidatesSet();

      if (useSqlite && sqliteDb) {
        try {
          const submittedApps = sqliteDb.prepare("SELECT email, data, submitted_at, last_saved_at FROM membership_applications WHERE LOWER(status) = 'submitted' OR submitted_at IS NOT NULL").all() as any[];
          for (const app of submittedApps) {
            const normEmail = (app.email || "").toLowerCase().trim();
            if (!normEmail) continue;
            const rawDate = app.submitted_at || app.last_saved_at || new Date().toISOString();
            const dateStr = rawDate.split('T')[0];

            let dataObj: any = {};
            try { dataObj = typeof app.data === 'string' ? JSON.parse(app.data) : (app.data || {}); } catch(e){}
            const appPhone = dataObj.phone || "";

            const existingCand = sqliteDb.prepare("SELECT id FROM candidates WHERE LOWER(email) = ?").get(normEmail) as any;
            if (existingCand) {
              sqliteDb.prepare("UPDATE candidates SET status = CASE WHEN status = 'Inquiry' THEN 'Applied' ELSE status END, application_date = COALESCE(NULLIF(application_date, ''), ?), phone = COALESCE(NULLIF(phone, ''), ?) WHERE LOWER(email) = ?").run(dateStr, appPhone, normEmail);
            } else {
              const userRow = sqliteDb.prepare("SELECT name FROM users WHERE LOWER(email) = ?").get(normEmail) as any;
              const firstName = dataObj.firstName || userRow?.name?.split(' ')[0] || normEmail.split('@')[0];
              const lastName = dataObj.lastName || (userRow?.name?.split(' ').slice(1).join(' ')) || '';
              const candName = `${firstName} ${lastName}`.trim();

              sqliteDb.prepare(`
                INSERT INTO candidates (id, name, email, phone, status, application_date, scores, notes, document_vault)
                VALUES (?, ?, ?, ?, 'Applied', ?, '{}', '', '[]')
              `).run('cand_' + normEmail.replace(/[^a-z0-9]/g, '_'), candName, normEmail, appPhone, dateStr);
            }
          }

          const rows = sqliteDb.prepare("SELECT * FROM candidates").all();
          candidates = rows.map((c: any) => ({
            ...c,
            scores: JSON.parse(c.scores || "{}"),
            document_vault: JSON.parse(c.document_vault || "[]")
          }));
        } catch (dbErr) {
          console.warn('SQLite candidates read error, falling back to JSON:', dbErr);
          candidates = getFallbackCandidates();
        }
      } else {
        candidates = getFallbackCandidates();
      }

      // Always double check JSON fallback applications to synthesize candidate statuses if they are submitted
      const appsJsonFile = path.join(process.cwd(), "data", "applications.json");
      if (fs.existsSync(appsJsonFile)) {
        try {
          const jsonApps = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
          Object.keys(jsonApps).forEach((email) => {
            const app = jsonApps[email];
            const appStatus = (app?.status || '').toString().toLowerCase();
            if (app && (appStatus === 'submitted' || app.submitted_at || app.submittedAt)) {
              const normEmail = email.toLowerCase().trim();
              const foundCand = candidates.find(c => c.email.toLowerCase().trim() === normEmail);
              const dataObj = app.data || app;
              const appPhone = dataObj.phone || "";
              const dateStr = (app.submitted_at || app.last_saved_at || new Date().toISOString()).split('T')[0];

              if (foundCand) {
                if (foundCand.status === 'Inquiry') {
                  foundCand.status = 'Applied';
                }
                if (!foundCand.application_date) {
                  foundCand.application_date = dateStr;
                }
                if (!foundCand.phone && appPhone) {
                  foundCand.phone = appPhone;
                }
              } else {
                const firstName = dataObj.firstName || normEmail.split('@')[0];
                const lastName = dataObj.lastName || "";
                const candName = `${firstName} ${lastName}`.trim();
                candidates.push({
                  id: 'cand_' + normEmail.replace(/[^a-z0-9]/g, '_'),
                  name: candName,
                  email: normEmail,
                  phone: appPhone,
                  status: 'Applied',
                  application_date: dateStr,
                  scores: {},
                  notes: '',
                  document_vault: []
                });
              }
            }
          });
        } catch (e) {
          console.error("Error updating candidate statuses from JSON fallback applications:", e);
        }
      }

      // Filter out deleted candidates across all sources, as well as test/purged accounts
      candidates = candidates.filter(c => {
        const cId = (c.id || "").toLowerCase().trim();
        const cEmail = (c.email || "").toLowerCase().trim();
        const isDummy = cEmail === 'candidate@gmail.com' || cEmail === 'dennis@gmail.com' || cEmail === 'jackdee.sync@gmail.com';
        return !deletedSet.has(cId) && !deletedSet.has(cEmail) && !isDummy;
      });

      res.json({ success: true, candidates });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/candidates/sync-bulk", (req, res) => {
    try {
      const { candidates } = req.body;
      if (!Array.isArray(candidates)) return res.status(400).json({ success: false });
      
      if (useSqlite && sqliteDb) {
        sqliteDb.transaction(() => {
          for (const cand of candidates) {
            const email = (cand.email || "").toLowerCase().trim();
            if (!email) continue;
            const existing = sqliteDb.prepare("SELECT id FROM candidates WHERE LOWER(email) = ?").get(email) as any;
            if (existing) {
              sqliteDb.prepare(`
                UPDATE candidates 
                SET status = ?, scores = ?, notes = ?, document_vault = ?
                WHERE id = ?
              `).run(
                cand.status,
                JSON.stringify(cand.scores || {}),
                cand.notes || "",
                JSON.stringify(cand.document_vault || []),
                existing.id
              );
            }
          }
        })();
      }
      
      // Update JSON fallback
      try {
        const fallbackList = getFallbackCandidates();
        let changed = false;
        for (const cand of candidates) {
          const emailNorm = (cand.email || "").toLowerCase().trim();
          if (!emailNorm) continue;
          const index = fallbackList.findIndex(c => c.email.toLowerCase() === emailNorm);
          if (index >= 0) {
            fallbackList[index] = { 
              ...fallbackList[index], 
              status: cand.status,
              scores: cand.scores || {},
              notes: cand.notes || "",
              document_vault: cand.document_vault || []
            };
            changed = true;
          }
        }
        if (changed) {
          saveFallbackCandidates(fallbackList);
        }
      } catch (err) {
        console.warn('Fallback sync failed:', err);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/candidates", (req, res) => {
    try {
      const { firstName: reqFirstName, lastName: reqLastName, name: reqName, email, phone, status, adminEmail } = req.body;

      const actorEmail = (adminEmail || req.headers['x-user-email'] || "").toString().toLowerCase().trim();
      if (actorEmail) {
        const actor = findUser(actorEmail);
        const isAdminOrChair = actor && (
          actor.role === 'admin' || 
          actor.role === 'Membership Committee Chair' || 
          actor.email.toLowerCase() === 'james.haywood@orderofkpi.org' ||
          actor.email.toLowerCase() === 'admin@orderofkpi.org'
        );
        if (!isAdminOrChair) {
          return res.status(403).json({ success: false, message: "Only Administrators and the Membership Committee Chair are authorized to add new candidates." });
        }
      }

      const firstName = (reqFirstName || "").trim();
      const lastName = (reqLastName || "").trim();
      const name = (reqName || `${firstName} ${lastName}`).trim();

      if (!name || !email) {
        return res.status(400).json({ success: false, message: "First name, last name, and email address are required." });
      }

      const emailNorm = email.toLowerCase().trim();
      const id = 'cand_' + emailNorm.replace(/[^a-z0-9]/g, '_');
      clearDeletedCandidateRecord(id, emailNorm);
      const initialStatus = status || "Inquiry";
      const application_date = initialStatus === 'Applied' ? new Date().toISOString().split('T')[0] : null;

      const digits = (phone || "").replace(/\D/g, "");
      const pass = digits.length >= 4 ? digits.slice(-4) : "2012";
      const passHash = hashPassword(pass);
      const displayFirstName = firstName || name.split(" ")[0];

      let savedInSqlite = false;
      if (useSqlite && sqliteDb) {
        try {
          const existingCand = sqliteDb.prepare("SELECT * FROM candidates WHERE LOWER(email) = ? OR id = ?").get(emailNorm, id) as any;
          if (!existingCand) {
            sqliteDb.prepare(`
              INSERT INTO candidates (id, name, email, phone, status, application_date, scores, notes, document_vault)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, name, emailNorm, phone || "", initialStatus, application_date, "{}", "", "[]");
          } else {
            sqliteDb.prepare(`
              UPDATE candidates SET name = ?, phone = ?, status = ?, application_date = COALESCE(application_date, ?) WHERE id = ?
            `).run(name, phone || "", initialStatus, application_date, existingCand.id);
          }

          const existingUser = sqliteDb.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(emailNorm) as any;
          if (!existingUser) {
            sqliteDb.prepare(`
              INSERT INTO users (
                email, name, first_name, password_hash, is_first_login,
                role, title, financial_status
              )
              VALUES (?, ?, ?, ?, 0, 'applicant', 'Candidate', 'inactive')
            `).run(emailNorm, name, displayFirstName, passHash);
          } else {
            sqliteDb.prepare(`
              UPDATE users SET role = 'applicant', password_hash = ? WHERE LOWER(email) = ?
            `).run(passHash, emailNorm);
          }
          savedInSqlite = true;
        } catch (sqliteErr) {
          console.warn('SQLite candidate write error, using JSON fallback:', sqliteErr);
        }
      }

      // Always update JSON fallback / applications store
      try {
        const fallbackList = getFallbackCandidates();
        const index = fallbackList.findIndex(c => c.email.toLowerCase() === emailNorm || c.id === id);
        const newCandidateEntry = {
          id,
          name,
          email: emailNorm,
          phone: phone || "",
          status: initialStatus,
          application_date,
          scores: {},
          notes: '',
          document_vault: []
        };
        if (index >= 0) {
          fallbackList[index] = { ...fallbackList[index], ...newCandidateEntry };
        } else {
          fallbackList.push(newCandidateEntry);
        }
        saveFallbackCandidates(fallbackList);
      } catch (jsonErr) {
        console.warn('Fallback candidates store error:', jsonErr);
      }

      if (fs.existsSync(jsonDbPath)) {
        try {
          const fileData = fs.readFileSync(jsonDbPath, "utf-8");
          const data = JSON.parse(fileData);
          data[emailNorm] = {
            email: emailNorm,
            name,
            first_name: displayFirstName,
            password_hash: passHash,
            is_first_login: 0,
            role: "applicant",
            title: "Candidate"
          };
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        } catch (e) {
          console.warn('JSON DB sync error:', e);
        }
      }

      logEvent(adminEmail || "admin", "CANDIDATE_CREATED", `Added new candidate ${name} (${emailNorm}) with applicant account role.`);

      res.json({ success: true, candidateId: id, message: `Candidate ${name} record created with applicant account successfully.` });
    } catch (err: any) {
      console.error('Error creating candidate:', err);
      res.status(500).json({ success: false, message: err.message || "Failed to create candidate record." });
    }
  });

  const handleCandidatePut = (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || req.query.id as string || req.body.id as string || "";
      const { name, status, scores, notes, document_vault, reviewerEmail } = req.body;
      
      if (useSqlite && sqliteDb) {
        if (name && !name.includes('@')) {
          sqliteDb.prepare(`
            UPDATE candidates 
            SET status = ?, scores = ?, notes = ?, document_vault = ?, name = ?
            WHERE id = ?
          `).run(
            status, 
            JSON.stringify(scores || {}), 
            notes || "", 
            JSON.stringify(document_vault || []), 
            name,
            id
          );
        } else {
          sqliteDb.prepare(`
            UPDATE candidates 
            SET status = ?, scores = ?, notes = ?, document_vault = ?
            WHERE id = ?
          `).run(
            status, 
            JSON.stringify(scores || {}), 
            notes || "", 
            JSON.stringify(document_vault || []), 
            id
          );
        }

        if (reviewerEmail) {
          const cand = sqliteDb.prepare("SELECT name, email FROM candidates WHERE id = ?").get(id) as any;
          if (cand) {
            logEvent(reviewerEmail, "CANDIDATE_STATUS_CHANGE", `Updated candidate ${cand.name} status to ${status}`);
          }
        }
      }

      try {
        const fallbackList = getFallbackCandidates();
        const index = fallbackList.findIndex(c => c.id === id);
        if (index >= 0) {
          fallbackList[index] = { 
            ...fallbackList[index], 
            status, 
            scores: scores || {}, 
            notes: notes || "", 
            document_vault: document_vault || [],
            name: (name && !name.includes('@')) ? name : fallbackList[index].name
          };
          saveFallbackCandidates(fallbackList);
        }
      } catch (err) {
        console.warn('Fallback update failed:', err);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.put("/api/candidates/:id", handleCandidatePut);
  app.put("/api/candidates", handleCandidatePut);

  async function deleteFirestoreCandidateApplication(email: string) {
    if (!firebaseProjectId || !firebaseApiKey || !email) return;
    const normEmail = email.toLowerCase().trim();
    const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    const dbId = firebaseDatabaseId || "ai-studio-orderofkpiocomint-87b8a669-8698-4f66-8799-ff9b38422e20";
    
    const urls = [
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/applications/${encodeURIComponent(safeDocId)}?key=${firebaseApiKey}`,
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/membership_applications/${encodeURIComponent(safeDocId)}?key=${firebaseApiKey}`,
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/candidates/${encodeURIComponent(normEmail)}?key=${firebaseApiKey}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          console.log(`[FIRESTORE DELETE] Successfully deleted document: ${url}`);
        } else {
          const text = await res.text();
          console.warn(`[FIRESTORE DELETE] Warning deleting document: ${url}. Status: ${res.status}. Response: ${text}`);
        }
      } catch (err) {
        console.error(`[FIRESTORE DELETE] Error deleting document: ${url}`, err);
      }
    }
  }

  const handleCandidateDelete = (req: express.Request, res: express.Response) => {
    try {
      const rawId = req.params.id || req.query.id as string || "";
      const { chairEmail } = req.query;
      const normId = decodeURIComponent(rawId || "").toLowerCase().trim();

      let targetCandName = "Candidate";
      let targetCandEmail = "";

      if (useSqlite && sqliteDb) {
        const cand = sqliteDb.prepare("SELECT name, email FROM candidates WHERE LOWER(id) = ? OR LOWER(email) = ?").get(normId, normId) as any;
        if (cand) {
          targetCandName = cand.name;
          targetCandEmail = cand.email;
        }
        sqliteDb.prepare("DELETE FROM candidates WHERE LOWER(id) = ? OR LOWER(email) = ?").run(normId, normId);
        if (targetCandEmail) {
          sqliteDb.prepare("DELETE FROM membership_applications WHERE LOWER(email) = ?").run(targetCandEmail.toLowerCase().trim());
        }
      }

      // Also search fallback candidates list
      const fallbackList = getFallbackCandidates();
      const matchInFallback = fallbackList.find(c => (c.id || "").toLowerCase() === normId || (c.email || "").toLowerCase() === normId);
      if (matchInFallback) {
        if (!targetCandEmail) targetCandEmail = matchInFallback.email;
        if (targetCandName === "Candidate") targetCandName = matchInFallback.name;
      }

      // Trigger background Firestore cleanup
      const emailToDel = (targetCandEmail || (normId.includes("@") ? normId : "")).toLowerCase().trim();
      if (emailToDel) {
        deleteFirestoreCandidateApplication(emailToDel).catch(err => {
          console.error("[FIRESTORE DELETE] Background delete failed:", err);
        });
      }

      // Remove from fallback list and save
      const newFallback = fallbackList.filter(c => (c.id || "").toLowerCase() !== normId && (c.email || "").toLowerCase() !== normId);
      saveFallbackCandidates(newFallback);

      // Also delete from fallback applications.json
      const appsJsonFile = path.join(process.cwd(), "data", "applications.json");
      if (fs.existsSync(appsJsonFile)) {
        try {
          const jsonStore = JSON.parse(fs.readFileSync(appsJsonFile, "utf-8"));
          let deletedAny = false;
          Object.keys(jsonStore).forEach(e => {
            const normE = e.toLowerCase().trim();
            if (normE === normId || (emailToDel && normE === emailToDel)) {
               delete jsonStore[e];
               deletedAny = true;
            }
          });
          if (deletedAny) {
            fs.writeFileSync(appsJsonFile, JSON.stringify(jsonStore, null, 2));
          }
        } catch(e) {}
      }

      // Record in persistent deleted candidates set
      recordDeletedCandidate(normId, targetCandEmail);

      // Log audit event
      logEvent((chairEmail as string) || "committee_chair", "CANDIDATE_REMOVED", `Removed candidate ${targetCandName} (${targetCandEmail || normId}) from active tracking`);

      res.json({ success: true, message: "Candidate removed successfully." });
    } catch (err: any) {
      console.error('Error deleting candidate:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.delete("/api/candidates/:id", handleCandidateDelete);
  app.delete("/api/candidates", handleCandidateDelete);

  // --- APPLICATION REVIEW AUDIT LOG ENDPOINTS ---

  app.get("/api/applications/audit", (req, res) => {
    try {
      if (useSqlite && sqliteDb) {
        const logs = sqliteDb.prepare("SELECT * FROM application_audit_logs ORDER BY timestamp DESC").all();
        res.json({ success: true, logs });
      } else {
        res.json({ success: true, logs: [] });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/applications/audit", (req, res) => {
    try {
      const { reviewer_email, reviewer_name, applicant_email, applicant_name, action } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      const timestamp = new Date().toISOString();

      if (useSqlite && sqliteDb) {
        sqliteDb.prepare(`
          INSERT INTO application_audit_logs (id, reviewer_email, reviewer_name, applicant_email, applicant_name, action, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, 
          reviewer_email || "", 
          reviewer_name || reviewer_email || "", 
          applicant_email || "", 
          applicant_name || applicant_email || "", 
          action || "ACCESSED_APPLICATION", 
          timestamp
        );
      }

      logEvent(reviewer_email || "system", "APPLICATION_AUDIT", `Reviewer ${reviewer_name || reviewer_email} performed ${action} on candidate ${applicant_name || applicant_email}`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- STANDING COMMITTEE MEMBER ENDPOINTS ---

  app.get("/api/committee/members", (req, res) => {
    try {
      const slug = (req.query.slug || req.query.committee || "") as string;
      let allUsers: any[] = [];
      if (useSqlite && sqliteDb) {
        allUsers = sqliteDb.prepare("SELECT * FROM users").all();
      } else if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        allUsers = Object.values(data);
      } else {
        allUsers = defaultUsers;
      }

      // Normalize each user's committees and committee roles
      const normalizedUsers = allUsers.map((u: any) => {
        let comms: string[] = [];
        let roles: Record<string, string> = {};
        try {
          if (Array.isArray(u.committees)) comms = u.committees;
          else if (typeof u.committees === 'string') comms = JSON.parse(u.committees);
        } catch(e) {}
        try {
          if (u.committeeRoles && typeof u.committeeRoles === 'object') roles = u.committeeRoles;
          else if (u.committee_roles && typeof u.committee_roles === 'object') roles = u.committee_roles;
          else if (typeof u.committee_roles === 'string') roles = JSON.parse(u.committee_roles);
          else if (typeof u.committeeRoles === 'string') roles = JSON.parse(u.committeeRoles);
        } catch(e) {}

        // Backward compatibility for legacy membership committee roles
        if (u.role === 'Membership Committee' || u.role === 'Membership Committee Chair' || u.email === 'james.haywood@orderofkpi.org') {
          if (!comms.includes('membership_intake')) comms.push('membership_intake');
          if (!roles['membership_intake']) {
            roles['membership_intake'] = (u.role === 'Membership Committee Chair' || u.email === 'james.haywood@orderofkpi.org') ? 'chair' : 'member';
          }
        }

        const normEmail = (u.email || '').toLowerCase().trim();
        if (u.title === 'Super Committee Chair') {
          u.title = 'Super Committee Chair';
          u.role = 'officer';
          const allSlugs = ['annual_event', 'scholarship', 'judicial_ethics', 'digital_technology', 'membership_intake', 'transfer_member'];
          allSlugs.forEach(s => {
            if (!comms.includes(s)) comms.push(s);
            roles[s] = 'chair';
          });
        }

        return {
          ...u,
          committees: comms,
          committeeRoles: roles
        };
      });

      if (!slug || slug === 'membership_intake') {
        const membershipMembers = normalizedUsers.filter(u => 
          u.committees.includes('membership_intake') || 
          u.role === 'Membership Committee' || 
          u.role === 'Membership Committee Chair' || 
          u.email === 'james.haywood@orderofkpi.org'
        );
        return res.json({ success: true, members: membershipMembers });
      }

      const matchingMembers = normalizedUsers.filter(u => u.committees.includes(slug));
      res.json({ success: true, members: matchingMembers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/committee/members", (req, res) => {
    try {
      const { email, chairEmail, committeeSlug, committeeRole, role } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Member email is required" });

      const normEmail = email.toLowerCase().trim();
      const targetSlug = committeeSlug || 'membership_intake';
      const targetRole = committeeRole || role || 'member';

      let user: any = null;
      if (useSqlite && sqliteDb) {
        user = sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(normEmail);
      } else if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        user = data[normEmail];
      }

      if (!user) {
        return res.status(404).json({ success: false, message: "User email not found in active directory" });
      }

      const uRole = (user.role || '').toLowerCase();
      const uTitle = (user.title || '').toLowerCase();
      const uFin = (user.financial_status || '').toLowerCase();

      let isFinancial = false;
      if (
        uFin === 'active' || 
        uRole === 'admin' || 
        uRole === 'officer' || 
        uRole === 'member' ||
        uRole === 'committee chair' ||
        uRole.includes('membership committee') ||
        normEmail === 'admin@orderofkpi.org' ||
        normEmail === 'qa.admin@orderofkpi.org' ||
        normEmail === 'info@kpi2012.org'
      ) {
        isFinancial = true;
      }

      if (cachedSheetData?.data?.members && Array.isArray(cachedSheetData.data.members)) {
        const sm = cachedSheetData.data.members.find((m: any) => 
          (m.kpiEmail && m.kpiEmail.toLowerCase().trim() === normEmail) ||
          (m.personalEmail && m.personalEmail.toLowerCase().trim() === normEmail)
        );
        if (sm && (sm.fy27Paid || sm.fy26Paid || sm.fy27MipEligible || sm.isEligibleVoter)) {
          isFinancial = true;
        }
      }

      if (
        uRole === 'applicant' || 
        uRole === 'prospective' || 
        uRole === 'candidate' || 
        uTitle === 'candidate' || 
        normEmail === 'candidate@gmail.com' ||
        normEmail.includes('candidate') ||
        !isFinancial
      ) {
        return res.status(403).json({ 
          success: false, 
          message: "Non-financial members, aspirants, or candidates are ineligible for committee assignments per organization constitution and bylaws. Members must have FY27 financial status checked in the official Google Sheet roster." 
        });
      }

      let comms: string[] = [];
      let roles: Record<string, string> = {};
      try {
        if (Array.isArray(user.committees)) comms = user.committees;
        else if (typeof user.committees === 'string') comms = JSON.parse(user.committees);
      } catch(e) {}
      try {
        if (user.committeeRoles && typeof user.committeeRoles === 'object') roles = user.committeeRoles;
        else if (user.committee_roles && typeof user.committee_roles === 'object') roles = user.committee_roles;
        else if (typeof user.committee_roles === 'string') roles = JSON.parse(user.committee_roles);
        else if (typeof user.committeeRoles === 'string') roles = JSON.parse(user.committeeRoles);
      } catch(e) {}

      if (!comms.includes(targetSlug)) {
        comms.push(targetSlug);
      }
      roles[targetSlug] = targetRole;

      const commsStr = JSON.stringify(comms);
      const rolesStr = JSON.stringify(roles);

      if (useSqlite && sqliteDb) {
        if (targetSlug === 'membership_intake' && user.role !== 'admin' && user.role !== 'officer') {
          const newLegacyRole = targetRole === 'chair' ? 'Membership Committee Chair' : 'Membership Committee';
          sqliteDb.prepare("UPDATE users SET role = ?, committees = ?, committee_roles = ? WHERE email = ?").run(newLegacyRole, commsStr, rolesStr, normEmail);
        } else {
          sqliteDb.prepare("UPDATE users SET committees = ?, committee_roles = ? WHERE email = ?").run(commsStr, rolesStr, normEmail);
        }
      }

      if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        if (data[normEmail]) {
          data[normEmail].committees = comms;
          data[normEmail].committeeRoles = roles;
          if (targetSlug === 'membership_intake' && data[normEmail].role !== 'admin' && data[normEmail].role !== 'officer') {
            data[normEmail].role = targetRole === 'chair' ? 'Membership Committee Chair' : 'Membership Committee';
          }
          fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
        }
      }

      // Sync to Firestore Cloud
      syncLocalMemberToFirestoreCloud(normEmail);

      logEvent(chairEmail || "system", "COMMITTEE_MEMBER_ADDED", `Granted ${targetSlug} (${targetRole}) access to ${normEmail}`);

      res.json({ success: true, message: `Member assigned to ${targetSlug} as ${targetRole} successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  const handleCommitteeMemberDelete = (req: express.Request, res: express.Response) => {
    try {
      const email = req.params.email || req.query.email as string || req.body.email as string || "";
      const targetSlug = (req.query.slug || req.query.committee || req.body.committeeSlug || 'membership_intake') as string;
      const { chairEmail } = req.query;
      const normEmail = email.toLowerCase().trim();

      if (targetSlug === 'membership_intake' && normEmail === 'james.haywood@orderofkpi.org') {
        return res.status(400).json({ success: false, message: "Cannot remove the Membership Committee Chair" });
      }

      let user: any = null;
      if (useSqlite && sqliteDb) {
        user = sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(normEmail);
      } else if (fs.existsSync(jsonDbPath)) {
        const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
        user = data[normEmail];
      }

      if (user) {
        let comms: string[] = [];
        let roles: Record<string, string> = {};
        try {
          if (Array.isArray(user.committees)) comms = user.committees;
          else if (typeof user.committees === 'string') comms = JSON.parse(user.committees);
        } catch(e) {}
        try {
          if (user.committeeRoles && typeof user.committeeRoles === 'object') roles = user.committeeRoles;
          else if (user.committee_roles && typeof user.committee_roles === 'object') roles = user.committee_roles;
          else if (typeof user.committee_roles === 'string') roles = JSON.parse(user.committee_roles);
          else if (typeof user.committeeRoles === 'string') roles = JSON.parse(user.committeeRoles);
        } catch(e) {}

        comms = comms.filter(c => c !== targetSlug);
        delete roles[targetSlug];

        const commsStr = JSON.stringify(comms);
        const rolesStr = JSON.stringify(roles);

        if (useSqlite && sqliteDb) {
          if (targetSlug === 'membership_intake' && (user.role === 'Membership Committee' || user.role === 'Membership Committee Chair')) {
            sqliteDb.prepare("UPDATE users SET role = 'member', committees = ?, committee_roles = ? WHERE email = ?").run(commsStr, rolesStr, normEmail);
          } else {
            sqliteDb.prepare("UPDATE users SET committees = ?, committee_roles = ? WHERE email = ?").run(commsStr, rolesStr, normEmail);
          }
        }

        if (fs.existsSync(jsonDbPath)) {
          const data = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));
          if (data[normEmail]) {
            data[normEmail].committees = comms;
            data[normEmail].committeeRoles = roles;
            if (targetSlug === 'membership_intake' && (data[normEmail].role === 'Membership Committee' || data[normEmail].role === 'Membership Committee Chair')) {
              data[normEmail].role = 'member';
            }
            fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
          }
        }

        syncLocalMemberToFirestoreCloud(normEmail);
      }

      logEvent((chairEmail as string) || "system", "COMMITTEE_MEMBER_REMOVED", `Removed ${targetSlug} committee access for ${normEmail}`);

      res.json({ success: true, message: `Member removed from ${targetSlug} committee.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.delete("/api/committee/members/:email", handleCommitteeMemberDelete);
  app.delete("/api/committee/members", handleCommitteeMemberDelete);

  // --- VOTING ENDPOINTS ---

  app.get("/api/votes", (req, res) => {
    try {
      if (useSqlite && sqliteDb) {
        const votes = sqliteDb.prepare("SELECT * FROM votes").all();
        res.json({ success: true, votes });
      } else {
        res.json({ success: true, votes: [] });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/votes", (req, res) => {
    try {
      const { voter_email, candidate_id, decision } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      const timestamp = new Date().toISOString();

      if (useSqlite && sqliteDb) {
        // Check if already voted
        const existing = sqliteDb.prepare("SELECT id FROM votes WHERE voter_email = ? AND candidate_id = ?").get(voter_email, candidate_id) as any;
        if (existing) {
          sqliteDb.prepare("UPDATE votes SET decision = ?, timestamp = ? WHERE id = ?").run(decision, timestamp, existing.id);
        } else {
          sqliteDb.prepare(`
            INSERT INTO votes (id, voter_email, candidate_id, decision, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `).run(id, voter_email, candidate_id, decision, timestamp);
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- DEAN NOMINATION ENDPOINTS ---
  const deanNominationsJsonPath = path.join(process.cwd(), "dean_nominations_fallback.json");
  function getFallbackDeanNominations(): any[] {
    try {
      if (fs.existsSync(deanNominationsJsonPath)) {
        return JSON.parse(fs.readFileSync(deanNominationsJsonPath, "utf-8"));
      }
    } catch (e) {}
    return [];
  }
  function saveFallbackDeanNominations(list: any[]) {
    try {
      fs.writeFileSync(deanNominationsJsonPath, JSON.stringify(list, null, 2));
    } catch (e) {}
  }

  // --- DEAN VOTING ENDPOINTS ---
  const deanVotesJsonPath = path.join(process.cwd(), "dean_votes_fallback.json");
  function getFallbackDeanVotes(): any[] {
    try {
      if (fs.existsSync(deanVotesJsonPath)) {
        return JSON.parse(fs.readFileSync(deanVotesJsonPath, "utf-8"));
      }
    } catch (e) {}
    return [];
  }
  function saveFallbackDeanVotes(list: any[]) {
    try {
      fs.writeFileSync(deanVotesJsonPath, JSON.stringify(list, null, 2));
    } catch (e) {}
  }

  async function getLegitimateVoterEmails(): Promise<Set<string>> {
    try {
      const isStale = Date.now() - cachedSheetData.lastFetched > 5 * 60 * 1000;
      if (isStale || !cachedSheetData.data) {
        await fetchGoogleSheetRosterLive().catch(() => {});
      }
      const set = new Set<string>();

      // Populate with pre-approved/default eligible voters as resilient baseline
      const DEFAULT_ELIGIBLE_DEAN_VOTERS = [
        "anthony.jones@orderofkpi.org", "antjones_cpm@yahoo.com",
        "brandon.owens@orderofkpi.org", "bmusicallyinclined@gmail.com",
        "brian.johnson@orderofkpi.org", "brianojohnson80@gmail.com",
        "brian.goings@orderofkpi.org", "brianbgoings@gmail.com",
        "darron.jenkins@orderofkpi.org", "dajenkins06@gmail.com",
        "denzel.talley@orderofkpi.org", "denzeltalley@gmail.com",
        "deshaun.safford@orderofkpi.org", "dsafford06@yahoo.com",
        "dominic.goodman@orderofkpi.org", "dominicsgoodman@gmail.com",
        "donald.mitchell@orderofkpi.org", "dmitchell02@gmail.com",
        "edward.cook@orderofkpi.org", "edward.j.cook@gmail.com",
        "ishmeal.allensworth@orderofkpi.org", "imallenswort@gmail.com",
        "jack.dee@orderofkpi.org", "jackdee@att.net",
        "james.haywood@orderofkpi.org", "jhaywood2008@gmail.com",
        "jason.pilar@orderofkpi.org", "jpilar06@gmail.com",
        "kameron.whitfield@orderofkpi.org", "kmaurw@gmail.com",
        "keith.woods@orderofkpi.org", "kwoods509@gmail.com",
        "tobias.bordley@orderofkpi.org", "c.tbordley@gmail.com",
        "candidate@gmail.com",
        "admin@orderofkpi.org",
        "qa.admin@orderofkpi.org",
        "info@kpi2012.org"
      ];
      for (const email of DEFAULT_ELIGIBLE_DEAN_VOTERS) {
        set.add(email.toLowerCase().trim());
      }

      if (cachedSheetData.data && Array.isArray(cachedSheetData.data.members)) {
        for (const member of cachedSheetData.data.members) {
          const fy27MipEligible = !!member.fy27MipEligible;
          const isEligible = fy27MipEligible;
          
          if (isEligible) {
            if (member.kpiEmail) set.add(member.kpiEmail.toLowerCase().trim());
            if (member.personalEmail) set.add(member.personalEmail.toLowerCase().trim());
          }
        }
      }
      return set;
    } catch (e) {
      console.error("Error computing legitimate voter emails:", e);
      return new Set();
    }
  }

  app.get("/api/admin/dean-votes", async (req, res) => {
    try {
      let votes: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          votes = sqliteDb.prepare("SELECT id, voter_email, nominee_name, timestamp FROM dean_votes").all();
        } catch (dbErr) {
          votes = getFallbackDeanVotes();
        }
      } else {
        votes = getFallbackDeanVotes();
      }

      // Automatic filtering routine for active member eligibility
      const legitEmails = await getLegitimateVoterEmails();
      const filteredVotes = votes.filter(v => {
        const email = (v.voter_email || "").toLowerCase().trim();
        if (email === "admin@orderofkpi.org" || email === "candidate@gmail.com") return false;
        return legitEmails.has(email);
      });

      res.json({ success: true, votes: filteredVotes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Support both PUT with path parameter AND PUT with query parameter
  const handleDeanVotePut = (req: express.Request, res: express.Response) => {
    try {
      const id = (req.params.id || req.query.id as string || "").trim();
      const email = (req.query.email as string || "").toLowerCase().trim();
      const { nominee_name } = req.body;
      if (!nominee_name) {
        return res.status(400).json({ success: false, message: "Nominee name is required." });
      }
      if (!id && !email) {
        return res.status(400).json({ success: false, message: "ID or email is required to update vote." });
      }

      if (useSqlite && sqliteDb) {
        try {
          if (id) {
            sqliteDb.prepare(`
              UPDATE dean_votes 
              SET nominee_name = ?
              WHERE id = ? OR LOWER(voter_email) = ?
            `).run(nominee_name.trim(), id, id.toLowerCase());
          }
          if (email) {
            sqliteDb.prepare(`
              UPDATE dean_votes 
              SET nominee_name = ?
              WHERE LOWER(voter_email) = ?
            `).run(nominee_name.trim(), email);
          }
        } catch (dbErr) {
          console.error("SQLite update dean vote error:", dbErr);
        }
      }

      const list = getFallbackDeanVotes();
      const idx = list.findIndex(v => 
        (id && (v.id === id || (v.voter_email || "").toLowerCase().trim() === id.toLowerCase().trim())) ||
        (email && (v.voter_email || "").toLowerCase().trim() === email)
      );
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          nominee_name: nominee_name.trim()
        };
        saveFallbackDeanVotes(list);
      }

      res.json({ success: true, message: "Vote updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.put("/api/admin/dean-votes/:id", handleDeanVotePut);
  app.put("/api/admin/dean-votes", handleDeanVotePut);

  // Support both DELETE with path parameter AND DELETE with query/body
  const handleDeanVoteDelete = async (req: express.Request, res: express.Response) => {
    try {
      const id = (req.params.id || req.query.id as string || req.body.id as string || "").trim();
      const email = (req.query.email as string || req.body.email as string || "").toLowerCase().trim();
      
      if (!id && !email) {
        return res.status(400).json({ success: false, message: "ID or email is required to delete vote." });
      }

      const cleanId = id.toLowerCase().trim();

      if (useSqlite && sqliteDb) {
        try {
          if (id) {
            sqliteDb.prepare("DELETE FROM dean_votes WHERE id = ? OR LOWER(voter_email) = ?").run(id, cleanId);
          }
          if (email) {
            sqliteDb.prepare("DELETE FROM dean_votes WHERE LOWER(voter_email) = ?").run(email);
          }
        } catch (dbErr) {
          console.error("SQLite delete dean vote error:", dbErr);
        }
      }

      let list = getFallbackDeanVotes();
      const target = list.find(v => 
        (id && (v.id.toString() === id.toString() || (v.voter_email || "").toLowerCase().trim() === cleanId)) ||
        (email && (v.voter_email || "").toLowerCase().trim() === email)
      );
      const emailToClean = target?.voter_email || email || (cleanId.includes("@") ? cleanId : "");

      list = list.filter(v => 
        !(id && (v.id.toString() === id.toString() || (v.voter_email || "").toLowerCase().trim() === cleanId)) &&
        !(email && (v.voter_email || "").toLowerCase().trim() === email)
      );
      saveFallbackDeanVotes(list);

      // Delete from Cloud Firestore if configured
      if (firebaseProjectId && firebaseApiKey) {
        const dbId = firebaseDatabaseId || "(default)";
        const docKeys = [id, cleanId, emailToClean, email].filter(Boolean);
        for (const k of docKeys) {
          const safeDocId = k.replace(/[^a-zA-Z0-9]/g, '_');
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/dean_votes/${encodeURIComponent(safeDocId)}?key=${firebaseApiKey}`;
          fetch(url, { method: "DELETE" }).catch(() => {});
          
          const urlDev = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${dbId}/documents/dean_votes_dev/${encodeURIComponent(safeDocId)}?key=${firebaseApiKey}`;
          fetch(urlDev, { method: "DELETE" }).catch(() => {});
        }
      }

      res.json({ success: true, message: "Vote deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.delete("/api/admin/dean-votes/:id", handleDeanVoteDelete);
  app.delete("/api/admin/dean-votes", handleDeanVoteDelete);

  app.get("/api/dean-votes", async (req, res) => {
    try {
      let votes: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          votes = sqliteDb.prepare("SELECT id, voter_email, nominee_name, timestamp FROM dean_votes").all();
        } catch (dbErr) {
          votes = getFallbackDeanVotes().map(v => ({
            id: v.id,
            voter_email: v.voter_email,
            nominee_name: v.nominee_name,
            timestamp: v.timestamp
          }));
        }
      } else {
        votes = getFallbackDeanVotes().map(v => ({
          id: v.id,
          voter_email: v.voter_email,
          nominee_name: v.nominee_name,
          timestamp: v.timestamp
        }));
      }

      // Automatic filtering routine for active member eligibility
      const legitEmails = await getLegitimateVoterEmails();
      const filteredVotes = votes.filter(v => {
        const email = (v.voter_email || "").toLowerCase().trim();
        if (email === "admin@orderofkpi.org" || email === "candidate@gmail.com") return false;
        return legitEmails.has(email);
      });

      res.json({ success: true, votes: filteredVotes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/dean-votes/user", async (req, res) => {
    try {
      const email = (req.query.email as string || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, message: "Email required" });
      }

      const legitEmails = await getLegitimateVoterEmails();
      if (!legitEmails.has(email) || email === "admin@orderofkpi.org" || email === "candidate@gmail.com") {
        return res.json({ success: true, vote: null, message: "User is not eligible to vote under Google Sheet active member criteria." });
      }

      let vote = null;
      if (useSqlite && sqliteDb) {
        try {
          vote = sqliteDb.prepare("SELECT id, nominee_name, timestamp FROM dean_votes WHERE LOWER(voter_email) = ?").get(email);
        } catch (dbErr) {
          const list = getFallbackDeanVotes();
          const found = list.find(v => (v.voter_email || "").toLowerCase().trim() === email);
          if (found) {
            vote = {
              id: found.id,
              nominee_name: found.nominee_name,
              timestamp: found.timestamp
            };
          }
        }
      } else {
        const list = getFallbackDeanVotes();
        const found = list.find(v => (v.voter_email || "").toLowerCase().trim() === email);
        if (found) {
          vote = {
            id: found.id,
            nominee_name: found.nominee_name,
            timestamp: found.timestamp
          };
        }
      }
      res.json({ success: true, vote });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  async function sendDeanVoteNotification(voterEmail: string, nomineeName: string, totalVotesCast: number) {
    // Clean and normalize environmental variables (handling quotes and trailing spaces which often happen in cloud dashboards)
    const cleanHost = (process.env.SMTP_HOST || "").replace(/^["']|["']$/g, "").trim();
    const smtpPortRaw = (process.env.SMTP_PORT || "587").replace(/^["']|["']$/g, "").trim();
    const smtpPort = parseInt(smtpPortRaw, 10) || 587;
    const cleanUser = (process.env.SMTP_USER || "").replace(/^["']|["']$/g, "").trim();
    const cleanPass = (process.env.SMTP_PASS || "").replace(/^["']|["']$/g, "").trim();
    const targetEmail = (process.env.NOTIFICATION_EMAIL || "info@kpi2012.org").replace(/^["']|["']$/g, "").trim();
    
    let cleanFrom = (process.env.SMTP_FROM || "").replace(/^["']|["']$/g, "").trim();
    if (!cleanFrom) {
      cleanFrom = cleanUser ? `"Order of KPI Portal" <${cleanUser}>` : `"Order of KPI Portal" <no-reply@orderofkpi.org>`;
    }

    const isLocal = process.env.NODE_ENV !== "production";
    const subjectPrefix = isLocal ? "[TEST] " : "";
    const subject = `${subjectPrefix}[Intake Dean Election] New Vote Cast for ${nomineeName}`;
    const textContent = `${isLocal ? "[TEST / LOCAL ENVIRONMENT NOTIFICATION]\n\n" : ""}A new vote has been cast for the Intake Team Dean election.

Details:
• Vote Cast For: ${nomineeName}
• Total Votes Cast To Date: ${totalVotesCast}

Logged: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
KP Member Portal`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfbf4;">
        ${isLocal ? `<div style="background-color: #d97706; color: #ffffff; padding: 8px 12px; text-align: center; font-weight: bold; font-size: 12px; border-radius: 6px 6px 0 0; letter-spacing: 1px; text-transform: uppercase;">⚠️ TEST / LOCAL ENVIRONMENT NOTIFICATION</div>` : ''}
        <div style="background-color: #1E3F20; color: #FFFFFF; padding: 20px; text-align: center; border-radius: ${isLocal ? '0' : '8px 8px 0 0'};">
          <h2 style="margin: 0; font-size: 20px;">Intake Team Dean Election Alert</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #D4AF37;">KP Member Portal</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">A new vote has been cast in the <strong>Intake Team Dean</strong> election.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f8f0; border-radius: 8px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #e2dfd2;">
              <td style="padding: 12px 16px; font-weight: bold; color: #1E3F20; width: 45%;">Candidate Voted For:</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #B8860B; font-size: 16px;">${nomineeName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; color: #1E3F20;">Total Ballots Cast To Date:</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #1E3F20; font-size: 16px;">${totalVotesCast}</td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #666666; margin-bottom: 0;">
            Logged on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
          </p>
        </div>
        <div style="text-align: center; padding: 12px; font-size: 11px; color: #888888; border-top: 1px solid #eaeaea;">
          This is an automated notification from the Order of KPI Portal.
        </div>
      </div>
    `;

    // Informative pre-checks logged directly to server output for ease of administrative troubleshooting
    if (!cleanHost || !cleanUser) {
      console.warn(`[Dean Vote Email Skip] SMTP host or user is empty. Clean SMTP Host: "${cleanHost}", Clean SMTP User: "${cleanUser}". Falling back to logging only.`);
      console.log(`[Dean Vote Email Logged] To: ${targetEmail} | Vote Cast For: ${nomineeName} | Total Votes Cast: ${totalVotesCast}`);
      return;
    }

    console.log(`[Dean Vote Email Attempt] Launching SMTP mail task to "${targetEmail}" via "${cleanHost}:${smtpPort}" (Secure: ${smtpPort === 465}, User: "${cleanUser}", From: "${cleanFrom}")`);

    try {
      const transporter = nodemailer.createTransport({
        host: cleanHost,
        port: smtpPort,
        secure: smtpPort === 465, // True for port 465, false for 587/25
        auth: {
          user: cleanUser,
          pass: cleanPass
        },
        tls: {
          // Do not fail on self-signed certs or hostname mismatches (very common in private domain SMTP servers)
          rejectUnauthorized: false
        },
        connectionTimeout: 15000, // 15s connection timeout limit
        greetingTimeout: 15000,   // 15s greeting timeout limit
      });

      // Try sending with friendly name sender
      try {
        const info = await transporter.sendMail({
          from: cleanFrom,
          to: targetEmail,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[Dean Vote Email Sent] Successfully sent vote notification to ${targetEmail} using friendly from (Message ID: ${info.messageId})`);
      } catch (firstErr: any) {
        console.warn(`[Dean Vote Email Warning] SMTP delivery failed with friendly from "${cleanFrom}". Retrying with raw SMTP user "${cleanUser}"... Error:`, firstErr.message);
        
        // Retry with raw SMTP user if it has an '@' symbol
        if (cleanUser && cleanUser.includes('@')) {
          const info = await transporter.sendMail({
            from: cleanUser,
            to: targetEmail,
            subject: subject,
            text: textContent,
            html: htmlContent
          });
          console.log(`[Dean Vote Email Sent] Successfully sent vote notification to ${targetEmail} after retry with raw sender (Message ID: ${info.messageId})`);
        } else {
          throw firstErr; // Propagate if no raw email fallback is available
        }
      }
    } catch (err: any) {
      console.error(`[Dean Vote Email Failed] SMTP dispatch completely failed for recipient "${targetEmail}" over "${cleanHost}:${smtpPort}":`, {
        errorMessage: err.message,
        errorCode: err.code,
        command: err.command
      });
    }
  }

  app.post("/api/dean-votes", async (req, res) => {
    try {
      const { voter_email, nominee_name } = req.body;
      if (!voter_email || !nominee_name) {
        return res.status(400).json({ success: false, message: "Voter email and nominee name are required." });
      }

      const emailNorm = voter_email.toLowerCase().trim();

      // Check Google Sheet active member criteria for eligibility
      const legitEmails = await getLegitimateVoterEmails();
      const isAdminOrTester = 
        emailNorm === "info@kpi2012.org" || 
        emailNorm === "admin@orderofkpi.org" || 
        emailNorm === "james.haywood@orderofkpi.org" || 
        emailNorm === "brian.johnson@orderofkpi.org" || 
        emailNorm === "candidate@gmail.com";

      if (!legitEmails.has(emailNorm) && !isAdminOrTester) {
        return res.status(403).json({ success: false, message: "Your account is not eligible to vote under Google Sheet active member criteria." });
      }

      const id = Math.random().toString(36).substring(2, 9);
      const timestamp = new Date().toISOString();

      if (useSqlite && sqliteDb) {
        try {
          const existing = sqliteDb.prepare("SELECT id FROM dean_votes WHERE LOWER(voter_email) = ?").get(emailNorm) as any;
          if (existing) {
            sqliteDb.prepare(`
              UPDATE dean_votes 
              SET nominee_name = ?, timestamp = ?
              WHERE LOWER(voter_email) = ?
            `).run(nominee_name.trim(), timestamp, emailNorm);
          } else {
            sqliteDb.prepare(`
              INSERT INTO dean_votes (id, voter_email, nominee_name, timestamp)
              VALUES (?, ?, ?, ?)
            `).run(id, emailNorm, nominee_name.trim(), timestamp);
          }
        } catch (dbErr) {
          console.error("SQLite dean votes error:", dbErr);
        }
      }

      const list = getFallbackDeanVotes();
      const idx = list.findIndex(v => (v.voter_email || "").toLowerCase().trim() === emailNorm);
      const entry = {
        id: idx >= 0 ? list[idx].id : id,
        voter_email: emailNorm,
        nominee_name: nominee_name.trim(),
        timestamp
      };
      if (idx >= 0) {
        list[idx] = entry;
      } else {
        list.push(entry);
      }
      saveFallbackDeanVotes(list);

      // Determine total number of votes cast
      let totalVotesCast = list.length;
      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare("SELECT COUNT(*) as cnt FROM dean_votes").get() as any;
          if (row && row.cnt) totalVotesCast = row.cnt;
        } catch (cntErr) {}
      }

      logEvent(emailNorm, "DEAN_VOTE_SUBMITTED", `Cast vote for Intake Dean: ${nominee_name}`);

      // Dispatch email notification asynchronously
      sendDeanVoteNotification(emailNorm, nominee_name.trim(), totalVotesCast).catch(err => {
        console.error("Dean vote notification trigger error:", err);
      });

      res.json({ success: true, message: "Vote successfully recorded." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/dean-votes/sync-bulk", async (req, res) => {
    try {
      const { votes } = req.body;
      if (!Array.isArray(votes)) {
        return res.status(400).json({ success: false, message: "Votes list required as array." });
      }

      const legitEmails = await getLegitimateVoterEmails();
      const list = getFallbackDeanVotes();

      for (const v of votes) {
        if (!v.voter_email || !v.nominee_name) continue;
        const emailNorm = v.voter_email.toLowerCase().trim();
        if (!legitEmails.has(emailNorm) || emailNorm === "admin@orderofkpi.org" || emailNorm === "candidate@gmail.com") {
          continue; // Discard ineligible / test votes
        }
        const id = v.id || Math.random().toString(36).substring(2, 9);
        const timestamp = v.timestamp || new Date().toISOString();

        if (useSqlite && sqliteDb) {
          try {
            const existing = sqliteDb.prepare("SELECT id FROM dean_votes WHERE LOWER(voter_email) = ?").get(emailNorm) as any;
            if (existing) {
              sqliteDb.prepare(`
                UPDATE dean_votes 
                SET nominee_name = ?, timestamp = ?
                WHERE LOWER(voter_email) = ?
              `).run(v.nominee_name.trim(), timestamp, emailNorm);
            } else {
              sqliteDb.prepare(`
                INSERT INTO dean_votes (id, voter_email, nominee_name, timestamp)
                VALUES (?, ?, ?, ?)
              `).run(id, emailNorm, v.nominee_name.trim(), timestamp);
            }
          } catch (dbErr) {
            console.error("SQLite bulk sync dean votes error:", dbErr);
          }
        }

        const idx = list.findIndex(item => (item.voter_email || "").toLowerCase().trim() === emailNorm);
        const entry = {
          id: idx >= 0 ? list[idx].id : id,
          voter_email: emailNorm,
          nominee_name: v.nominee_name.trim(),
          timestamp
        };
        if (idx >= 0) {
          list[idx] = entry;
        } else {
          list.push(entry);
        }
      }

      saveFallbackDeanVotes(list);
      res.json({ success: true, message: "Votes bulk sync completed successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- CANDIDATE VOTING ENDPOINTS ---
  const candidateVotesJsonPath = path.join(process.cwd(), "candidate_votes_fallback.json");
  function getFallbackCandidateVotes(): any[] {
    try {
      if (fs.existsSync(candidateVotesJsonPath)) {
        return JSON.parse(fs.readFileSync(candidateVotesJsonPath, "utf-8"));
      }
    } catch (e) {}
    return [];
  }
  function saveFallbackCandidateVotes(list: any[]) {
    try {
      fs.writeFileSync(candidateVotesJsonPath, JSON.stringify(list, null, 2));
    } catch (e) {}
  }

  app.get("/api/candidate-votes", async (req, res) => {
    try {
      let votes: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          votes = sqliteDb.prepare("SELECT id, voter_email, candidate_id, candidate_name, decision, timestamp FROM candidate_votes").all();
        } catch (dbErr) {
          votes = getFallbackCandidateVotes();
        }
      } else {
        votes = getFallbackCandidateVotes();
      }
      const legitEmails = await getLegitimateVoterEmails();
      const filtered = votes.filter(v => {
        const email = (v.voter_email || "").toLowerCase().trim();
        if (email === "admin@orderofkpi.org" || email === "candidate@gmail.com") return true;
        return legitEmails.has(email);
      });
      res.json({ success: true, votes: filtered });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/candidate-votes/user", async (req, res) => {
    try {
      const email = (req.query.email as string || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, message: "Email required" });
      }
      let votes: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          votes = sqliteDb.prepare("SELECT id, candidate_id, candidate_name, decision, timestamp FROM candidate_votes WHERE LOWER(voter_email) = ?").all(email);
        } catch (dbErr) {
          votes = getFallbackCandidateVotes().filter(v => (v.voter_email || "").toLowerCase().trim() === email);
        }
      } else {
        votes = getFallbackCandidateVotes().filter(v => (v.voter_email || "").toLowerCase().trim() === email);
      }
      res.json({ success: true, votes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/candidate-votes", async (req, res) => {
    try {
      const { voter_email, candidate_id, candidate_name, decision } = req.body;
      if (!voter_email || !candidate_id || !decision) {
        return res.status(400).json({ success: false, message: "Voter email, candidate ID, and decision required." });
      }
      const emailNorm = voter_email.toLowerCase().trim();
      const dec = decision.toLowerCase().trim();
      if (dec !== 'yes' && dec !== 'no') {
        return res.status(400).json({ success: false, message: "Decision must be 'yes' or 'no'." });
      }

      const legitEmails = await getLegitimateVoterEmails();
      const isAdminEmail = emailNorm === 'admin@orderofkpi.org' || emailNorm === 'candidate@gmail.com' || emailNorm === 'qa.admin@orderofkpi.org' || emailNorm === 'info@kpi2012.org';
      if (!legitEmails.has(emailNorm) && !isAdminEmail) {
        return res.status(403).json({ success: false, message: "Only eligible members (FY27 MIP Eligible) may cast candidate votes." });
      }

      const id = `${emailNorm.replace(/[^a-zA-Z0-9]/g, '_')}_${String(candidate_id).replace(/[^a-zA-Z0-9]/g, '_')}`;
      const timestamp = new Date().toISOString();

      if (useSqlite && sqliteDb) {
        try {
          const existing = sqliteDb.prepare("SELECT id FROM candidate_votes WHERE id = ? OR (LOWER(voter_email) = ? AND candidate_id = ?)").get(id, emailNorm, candidate_id) as any;
          if (existing) {
            sqliteDb.prepare("UPDATE candidate_votes SET decision = ?, timestamp = ? WHERE id = ?").run(dec, timestamp, existing.id || id);
          } else {
            sqliteDb.prepare("INSERT INTO candidate_votes (id, voter_email, candidate_id, candidate_name, decision, timestamp) VALUES (?, ?, ?, ?, ?, ?)").run(id, emailNorm, candidate_id, candidate_name || '', dec, timestamp);
          }
        } catch (dbErr) {
          console.error("SQLite candidate vote error:", dbErr);
        }
      }

      const list = getFallbackCandidateVotes();
      const idx = list.findIndex(v => v.id === id || ((v.voter_email || '').toLowerCase().trim() === emailNorm && String(v.candidate_id) === String(candidate_id)));
      const entry = { id, voter_email: emailNorm, candidate_id: String(candidate_id), candidate_name: candidate_name || '', decision: dec, timestamp };
      if (idx >= 0) {
        list[idx] = entry;
      } else {
        list.push(entry);
      }
      saveFallbackCandidateVotes(list);

      logEvent(emailNorm, "CANDIDATE_VOTE_CAST", `Cast candidate vote '${dec}' for ${candidate_name || candidate_id}`);
      res.json({ success: true, message: "Candidate vote successfully recorded." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/candidate-votes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (useSqlite && sqliteDb) {
        try {
          sqliteDb.prepare("DELETE FROM candidate_votes WHERE id = ?").run(id);
        } catch (e) {}
      }
      const list = getFallbackCandidateVotes().filter(v => v.id !== id);
      saveFallbackCandidateVotes(list);
      res.json({ success: true, message: "Vote deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/candidate-votes/sync-bulk", async (req, res) => {
    try {
      const { votes } = req.body;
      if (!Array.isArray(votes)) {
        return res.status(400).json({ success: false, message: "Votes required as array." });
      }
      const list = getFallbackCandidateVotes();
      for (const v of votes) {
        if (!v.voter_email || !v.candidate_id || !v.decision) continue;
        const id = v.id || `${v.voter_email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}_${String(v.candidate_id).replace(/[^a-zA-Z0-9]/g, '_')}`;
        const timestamp = v.timestamp || new Date().toISOString();
        if (useSqlite && sqliteDb) {
          try {
            const existing = sqliteDb.prepare("SELECT id FROM candidate_votes WHERE id = ?").get(id);
            if (existing) {
              sqliteDb.prepare("UPDATE candidate_votes SET decision = ?, timestamp = ? WHERE id = ?").run(v.decision, timestamp, id);
            } else {
              sqliteDb.prepare("INSERT INTO candidate_votes (id, voter_email, candidate_id, candidate_name, decision, timestamp) VALUES (?, ?, ?, ?, ?, ?)").run(id, v.voter_email.toLowerCase().trim(), String(v.candidate_id), v.candidate_name || '', v.decision, timestamp);
            }
          } catch (e) {}
        }
        const idx = list.findIndex(item => item.id === id);
        const entry = { id, voter_email: v.voter_email.toLowerCase().trim(), candidate_id: String(v.candidate_id), candidate_name: v.candidate_name || '', decision: v.decision, timestamp };
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
      }
      saveFallbackCandidateVotes(list);
      res.json({ success: true, message: "Candidate votes bulk sync completed." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/dean-nominations", async (req, res) => {
    try {
      const fallbackList = getFallbackDeanNominations();
      let sqliteList: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          sqliteList = sqliteDb.prepare("SELECT id, voter_email, nominee_first_name, nominee_last_name, statement, timestamp FROM dean_nominations").all();
        } catch (dbErr) {}
      }
      const map = new Map<string, any>();
      for (const item of [...fallbackList, ...sqliteList]) {
        if (!item || !item.voter_email) continue;
        map.set(item.voter_email.toLowerCase().trim(), item);
      }

      // Filter to only eligible nominators
      const legitEmails = await getLegitimateVoterEmails();
      const filteredNominations = Array.from(map.values()).filter(nom => {
        const email = (nom.voter_email || "").toLowerCase().trim();
        if (email === "admin@orderofkpi.org" || email === "candidate@gmail.com") return false;
        return legitEmails.has(email);
      });

      res.json({ success: true, nominations: filteredNominations });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  const handleDeanNominationPut = (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || req.query.id as string || req.body.id as string || "";
      const { nominee_first_name, nominee_last_name, statement } = req.body;
      if (!nominee_first_name || !nominee_last_name || !statement) {
        return res.status(400).json({ success: false, message: "All fields are required." });
      }

      if (useSqlite && sqliteDb) {
        try {
          sqliteDb.prepare(`
            UPDATE dean_nominations 
            SET nominee_first_name = ?, nominee_last_name = ?, statement = ?
            WHERE id = ?
          `).run(nominee_first_name.trim(), nominee_last_name.trim(), statement.trim(), id);
        } catch (dbErr) {
          console.error("SQLite update nomination error:", dbErr);
        }
      }

      const list = getFallbackDeanNominations();
      const idx = list.findIndex(n => n.id === id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          nominee_first_name: nominee_first_name.trim(),
          nominee_last_name: nominee_last_name.trim(),
          statement: statement.trim()
        };
        saveFallbackDeanNominations(list);
      }

      res.json({ success: true, message: "Nomination updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.put("/api/admin/dean-nominations/:id", handleDeanNominationPut);
  app.put("/api/admin/dean-nominations", handleDeanNominationPut);

  const handleDeanNominationDelete = (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || req.query.id as string || "";

      if (useSqlite && sqliteDb) {
        try {
          sqliteDb.prepare("DELETE FROM dean_nominations WHERE id = ?").run(id);
        } catch (dbErr) {
          console.error("SQLite delete nomination error:", dbErr);
        }
      }

      let list = getFallbackDeanNominations();
      list = list.filter(n => n.id !== id);
      saveFallbackDeanNominations(list);

      res.json({ success: true, message: "Nomination deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  app.delete("/api/admin/dean-nominations/:id", handleDeanNominationDelete);
  app.delete("/api/admin/dean-nominations", handleDeanNominationDelete);

  app.get("/api/dean-nominations", async (req, res) => {
    try {
      const fallbackList = getFallbackDeanNominations();
      let sqliteList: any[] = [];
      if (useSqlite && sqliteDb) {
        try {
          sqliteList = sqliteDb.prepare("SELECT id, voter_email, nominee_first_name, nominee_last_name, statement, timestamp FROM dean_nominations").all();
        } catch (dbErr) {}
      }
      const map = new Map<string, any>();
      for (const item of [...fallbackList, ...sqliteList]) {
        if (!item) continue;
        const key = (item.voter_email || item.id || Math.random().toString()).toLowerCase().trim();
        map.set(key, {
          id: item.id,
          voter_email: item.voter_email,
          nominee_first_name: item.nominee_first_name,
          nominee_last_name: item.nominee_last_name,
          statement: item.statement,
          timestamp: item.timestamp
        });
      }

      // Filter to only eligible nominators
      const legitEmails = await getLegitimateVoterEmails();
      const filteredNominations = Array.from(map.values()).filter(nom => {
        const email = (nom.voter_email || "").toLowerCase().trim();
        if (email === "admin@orderofkpi.org" || email === "candidate@gmail.com") return false;
        return legitEmails.has(email);
      });

      res.json({ success: true, nominations: filteredNominations });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/dean-nominations/user", async (req, res) => {
    try {
      const email = (req.query.email as string || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, message: "Email required" });
      }

      const legitEmails = await getLegitimateVoterEmails();
      if (!legitEmails.has(email) || email === "admin@orderofkpi.org" || email === "candidate@gmail.com") {
        return res.json({ success: true, nomination: null, message: "User is not eligible under Google Sheet active member criteria." });
      }

      let nomination = null;
      if (useSqlite && sqliteDb) {
        try {
          nomination = sqliteDb.prepare("SELECT id, nominee_first_name, nominee_last_name, statement, timestamp FROM dean_nominations WHERE LOWER(voter_email) = ?").get(email);
        } catch (dbErr) {
          const list = getFallbackDeanNominations();
          const found = list.find(n => (n.voter_email || "").toLowerCase().trim() === email);
          if (found) {
            nomination = {
              id: found.id,
              nominee_first_name: found.nominee_first_name,
              nominee_last_name: found.nominee_last_name,
              statement: found.statement,
              timestamp: found.timestamp
            };
          }
        }
      } else {
        const list = getFallbackDeanNominations();
        const found = list.find(n => (n.voter_email || "").toLowerCase().trim() === email);
        if (found) {
          nomination = {
            id: found.id,
            nominee_first_name: found.nominee_first_name,
            nominee_last_name: found.nominee_last_name,
            statement: found.statement,
            timestamp: found.timestamp
          };
        }
      }
      res.json({ success: true, nomination });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/dean-nominations", (req, res) => {
    return res.status(403).json({ 
      success: false, 
      message: "The Intake Dean nomination period is formally closed. New nominations are no longer being accepted." 
    });
  });

  app.post("/api/dean-nominations/sync-bulk", (req, res) => {
    try {
      const { nominations } = req.body;
      if (!Array.isArray(nominations)) {
        return res.status(400).json({ success: false, message: "Nominations list required as array." });
      }

      const list = getFallbackDeanNominations();

      for (const n of nominations) {
        if (!n.voter_email || !n.nominee_first_name || !n.nominee_last_name || !n.statement) continue;
        const emailNorm = n.voter_email.toLowerCase().trim();
        const id = n.id || Math.random().toString(36).substring(2, 9);
        const timestamp = n.timestamp || new Date().toISOString();

        if (useSqlite && sqliteDb) {
          try {
            const existing = sqliteDb.prepare("SELECT id FROM dean_nominations WHERE LOWER(voter_email) = ?").get(emailNorm) as any;
            if (existing) {
              sqliteDb.prepare(`
                UPDATE dean_nominations 
                SET nominee_first_name = ?, nominee_last_name = ?, statement = ?, timestamp = ?
                WHERE LOWER(voter_email) = ?
              `).run(n.nominee_first_name.trim(), n.nominee_last_name.trim(), n.statement.trim(), timestamp, emailNorm);
            } else {
              sqliteDb.prepare(`
                INSERT INTO dean_nominations (id, voter_email, nominee_first_name, nominee_last_name, statement, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(id, emailNorm, n.nominee_first_name.trim(), n.nominee_last_name.trim(), n.statement.trim(), timestamp);
            }
          } catch (dbErr) {
            console.error("SQLite bulk sync dean nominations error:", dbErr);
          }
        }

        const idx = list.findIndex(item => (item.voter_email || "").toLowerCase().trim() === emailNorm);
        const entry = {
          id: idx >= 0 ? list[idx].id : id,
          voter_email: emailNorm,
          nominee_first_name: n.nominee_first_name.trim(),
          nominee_last_name: n.nominee_last_name.trim(),
          statement: n.statement.trim(),
          timestamp
        };
        if (idx >= 0) {
          list[idx] = entry;
        } else {
          list.push(entry);
        }
      }

      saveFallbackDeanNominations(list);
      res.json({ success: true, message: "Nominations bulk sync completed successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
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

  app.post("/api/minutes/generate", async (req, res) => {
    try {
      const { rawNotes } = req.body;
      if (!rawNotes) {
        return res.status(400).json({ error: "Notes are required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Please transform the following raw meeting notes into a professional, structured meeting minutes document for the Order of KPI. Include: 
        1. Meeting Title & Date (infer if possible, otherwise use placeholders)
        2. Attendance List
        3. Agenda Items
        4. Key Discussions
        5. Action Items (with owners if mentioned)
        6. Next Meeting Info
        
        Raw Notes:
        ${rawNotes}`,
        config: {
          systemInstruction: "You are the Grammateus (Secretary) of a prestigious organization. Your tone is professional, traditional, and structured.",
        },
      });

      res.json({ success: true, minutes: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const cleanupAndExit = () => {
    if (sqliteDb) {
      try {
        sqliteDb.close();
        sqliteDb = null;
      } catch (_) {}
    }
    server.close();
  };

  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGINT', cleanupAndExit);
}

startServer();
