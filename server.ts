import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleAuth } from "google-auth-library";
import { sheets } from "@googleapis/sheets";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Google Auth
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  
  const sheetsApi = sheets({ version: "v4", auth });

  app.get("/api/registrations", async (req, res) => {
    try {
      const spreadsheetId = "1rPsW1nfG_p6jLQRZD_n4-Ee38-BGYtVoCaMm0Gu15f8";
      
      // Get the sheet metadata to find the name of the first sheet if Sheet1 fails
      const metadataResponse = await sheetsApi.spreadsheets.get({
        spreadsheetId,
      });
      const firstSheetName = metadataResponse.data.sheets?.[0]?.properties?.title || "Sheet1";

      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range: firstSheetName,
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
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
