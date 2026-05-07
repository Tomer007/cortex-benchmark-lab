import "dotenv/config";
import express from "express";

import path from "path";
import { spawn } from "child_process";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // API to run the python tests
  const activeProcesses = new Map<string, any>();

  // API Check
  app.get("/api/system-check", (req, res) => {
    res.json({
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.post("/api/kill-bench", (req, res) => {
    const { id } = req.body;
    const proc = activeProcesses.get(id);
    if (proc) {
      proc.kill();
      activeProcesses.delete(id);
      return res.json({ success: true, message: "Process terminated." });
    }
    res.status(404).json({ error: "No active process found." });
  });

  app.get("/api/prompts", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "test_prompt_system.py");
      if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return res.status(404).json({ error: "Source file not found" });
      }
      
      const content = fs.readFileSync(filePath, "utf-8");
      
      const extract = (varName: string) => {
        // More robust regex that handles python prefixes (f, r, b) and multiline quotes
        const regex = new RegExp(`${varName}\\s*=\\s*[frb]?["']{3}([\\s\\S]*?)["']{3}`, "m");
        const match = content.match(regex);
        if (match) {
          return match[1].trim();
        }
        return "";
      };

      const result = {
        base: extract("LAYER_1"),
        simulation: extract("SIMULATION_ADDON"),
        adaptive: extract("ADAPTIVE_ADDON"),
        deep_learning: extract("DEEP_LEARNING_ADDON"),
        guardrails: extract("LAYER_4")
      };

      console.log("Extracted prompts status:", {
        base: !!result.base,
        simulation: !!result.simulation,
        adaptive: !!result.adaptive,
        deep_learning: !!result.deep_learning,
        guardrails: !!result.guardrails
      });

      res.json(result);
    } catch (err) {
      console.error("Error in /api/prompts:", err);
      res.status(500).json({ error: "Failed to read prompts" });
    }
  });

  app.post("/api/run-tests", async (req, res) => {
    const { model, filter, customContext, contextType, include, prompts } = req.body;
    
    const args = ["test_prompt_system.py", "--json"];
    if (model) args.push("--model", model);
    if (filter) args.push("--filter", filter);
    if (include) args.push("--include", include);
    if (contextType) args.push("--type", contextType);
    if (customContext || prompts) args.push("--stdin");
    
    console.log(`Executing: python3 ${args.join(" ")}`);
    
    const startTime = Date.now();
    const pythonProcess = spawn("python3", args, {
      env: { 
        ...process.env,
        PYTHONUNBUFFERED: "1"
      }
    });

    const benchId = Date.now().toString();
    activeProcesses.set(benchId, pythonProcess);

    let responded = false;

    const timeout = setTimeout(() => {
      pythonProcess.kill();
      activeProcesses.delete(benchId);
      if (!responded) {
        responded = true;
        res.status(504).json({ error: "Benchmark timed out after 60 seconds." });
      }
    }, 60000);

    let stdout = "";
    let stderr = "";

    if (customContext || prompts) {
      const payload: any = {};
      if (customContext) payload.context = customContext;
      if (prompts) payload.prompts = prompts;
      
      // If only context is present and no prompts, just send context to maintain backward compatibility if needed
      // but actually the python script handles it now.
      pythonProcess.stdin.write(JSON.stringify(payload.prompts ? payload : customContext));
      pythonProcess.stdin.end();
    }

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      activeProcesses.delete(benchId);
      if (responded) return;
      responded = true;

      const duration = Date.now() - startTime;
      console.log(`Benchmark execution finished in ${duration}ms with code ${code}`);

      if (code !== 0) {
        return res.status(500).json({ 
          error: stderr || "Execution failed",
          details: stdout,
          code 
        });
      }

      try {
        const results = JSON.parse(stdout);
        res.json({
          results,
          metadata: {
            duration,
            model: model || "default",
            timestamp: new Date().toISOString()
          }
        });
      } catch (e) {
        console.error("JSON parse error:", e, stdout);
        res.status(500).json({ 
          error: "Failed to parse benchmark results", 
          raw: stdout,
          stderr: stderr 
        });
      }
    });
  });

  // Vite middleware for development (dynamic import so production bundle doesn't require vite)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
