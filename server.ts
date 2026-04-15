import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Mock Scheme Data
  const schemes = [
    {
      id: "scholarship-1",
      name: "Higher Education Support Scheme",
      rules: {
        minAge: 18,
        maxAge: 25,
        maxIncome: 200000,
        education: "High School",
      }
    },
    {
      id: "housing-1",
      name: "Urban Housing Subsidy",
      rules: {
        minAge: 21,
        maxIncome: 500000,
        category: "General",
      }
    }
  ];

  app.post("/api/eligibility/check", (req, res) => {
    const { age, income, category, education } = req.body;
    
    const results = schemes.map(scheme => {
      const isEligible = 
        (!scheme.rules.minAge || age >= scheme.rules.minAge) &&
        (!scheme.rules.maxAge || age <= scheme.rules.maxAge) &&
        (!scheme.rules.maxIncome || income <= scheme.rules.maxIncome) &&
        (!scheme.rules.education || education === scheme.rules.education) &&
        (!scheme.rules.category || category === scheme.rules.category);
      
      return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        isEligible,
        reason: isEligible ? "Matches all criteria." : "Does not meet one or more criteria (age, income, or education)."
      };
    });

    res.json({ results });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Vite Middleware ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
