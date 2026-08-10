import fs from 'fs';
const code = fs.readFileSync('server.ts', 'utf-8');

const target = `      if (useSqlite && sqliteDb) {
        sqliteDb.prepare(\`
          UPDATE candidates 
          SET status = ?, scores = ?, notes = ?, document_vault = ?
          WHERE id = ?
        \`).run(
          status, 
          JSON.stringify(scores || {}), 
          notes || "", 
          JSON.stringify(document_vault || []), 
          id
        );

        if (reviewerEmail) {
          const cand = sqliteDb.prepare("SELECT name, email FROM candidates WHERE id = ?").get(id) as any;
          if (cand) {
            logEvent(reviewerEmail, "CANDIDATE_STATUS_CHANGE", \`Updated candidate \${cand.name} status to \${status}\`);
          }
        }
      }

      res.json({ success: true });`;

const replacement = `      if (useSqlite && sqliteDb) {
        sqliteDb.prepare(\`
          UPDATE candidates 
          SET status = ?, scores = ?, notes = ?, document_vault = ?
          WHERE id = ?
        \`).run(
          status, 
          JSON.stringify(scores || {}), 
          notes || "", 
          JSON.stringify(document_vault || []), 
          id
        );

        if (reviewerEmail) {
          const cand = sqliteDb.prepare("SELECT name, email FROM candidates WHERE id = ?").get(id) as any;
          if (cand) {
            logEvent(reviewerEmail, "CANDIDATE_STATUS_CHANGE", \`Updated candidate \${cand.name} status to \${status}\`);
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
            document_vault: document_vault || [] 
          };
          saveFallbackCandidates(fallbackList);
        }
      } catch (err) {
        console.warn('Fallback update failed:', err);
      }

      res.json({ success: true });`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('patched put candidate');
} else {
  console.log('target not found');
}
