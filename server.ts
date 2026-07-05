import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase request size limit for image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Server-side Gemini API route for room image analysis
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in the server environment." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        "You are an expert Royal interior designer and professional AI design advisor. " +
        "Analyze the uploaded room image and provide a highly detailed, professional, and structured report in Arabic. " +
        "Make your report incredibly premium, motivating, and detailed, using bullet points and neat formatting. " +
        "Analyze the following areas in depth:\n" +
        "1. Style (النمط والتصميم العام - identify the current style, e.g., Modern, Neo-classical, Classic, Minimalist, Scandinavian, etc.)\n" +
        "2. Colors (الألوان وتناسقها - evaluate the current palette, suggest accents)\n" +
        "3. Flooring (الأرضيات وخاماتها - evaluate material like marble, parquet, porcelain, and recommend optimal finishes)\n" +
        "4. Lighting (الإضاءة وتأثيرها - identify ambient, task, and accent lighting opportunities)\n" +
        "5. Furniture (الأثاث وتوزيعه - evaluate proportions, layout, and ergonomic alignment)\n" +
        "6. Wood finishes (التشطيبات الخشبية وألوانها - examine doors, panels, cabinets, wardrobes)\n\n" +
        "Conclude with a clear set of modern, actionable Royal Group design recommendations for improvement. Keep the tone sophisticated, professional, and premium.";

      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64,
        },
      };

      const textPart = {
        text: "الرجاء تحليل هذه الغرفة وتقديم تقرير تصميم داخلي احترافي مفصل للغاية باللغة العربية يشمل النمط، الألوان، الأرضيات، الإضاءة، الأثاث، والتشطيبات الخشبية، مع نصائح ملكية محددة للتطوير والتحسين.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ report: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  // Vite middleware for development or serving static files in production
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
