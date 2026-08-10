import fs from 'fs';
const code = fs.readFileSync('server.ts', 'utf-8');

const target = `      if (useSqlite && sqliteDb) {
        sqliteDb.transaction(() => {
          for (const cand of candidates) {
            const email = (cand.email || "").toLowerCase().trim();
            if (!email) continue;
            const existing = sqliteDb.prepare("SELECT id FROM candidates WHERE LOWER(email) = ?").get(email) as any;
            if (existing) {
              sqliteDb.prepare(\`
                UPDATE candidates 
                SET status = ?, scores = ?, notes = ?, document_vault = ?
                WHERE id = ?
              \`).run(
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
      res.json({ success: true });`;

const replacement = `      if (useSqlite && sqliteDb) {
        sqliteDb.transaction(() => {
          for (const cand of candidates) {
            const email = (cand.email || "").toLowerCase().trim();
            if (!email) continue;
            const existing = sqliteDb.prepare("SELECT id FROM candidates WHERE LOWER(email) = ?").get(email) as any;
            if (existing) {
              sqliteDb.prepare(\`
                UPDATE candidates 
                SET status = ?, scores = ?, notes = ?, document_vault = ?
                WHERE id = ?
              \`).run(
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
      
      res.json({ success: true });`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('patched server.ts sync-bulk');
} else {
  console.log('target not found in server.ts');
}
