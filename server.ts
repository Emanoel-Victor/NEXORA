import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { supabaseService } from "./src/services/supabaseService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Perfect Pay Webhook
  app.post("/api/webhooks/perfect-pay", async (req, res) => {
    // ... (webhook logic remains the same)
    console.log("Perfect Pay Webhook received:", req.body);
    
    const { event, sale_status, subscription_status, us_id, product_id } = req.body;

    if (!us_id) {
      console.error("No user ID (us_id) found in webhook data");
      return res.status(400).json({ error: "Missing us_id" });
    }

    try {
      const PRO_PRODUCT_ID = process.env.PERFECT_PAY_PRO_ID || "PRO_123";
      const PREMIUM_PRODUCT_ID = process.env.PERFECT_PAY_PREMIUM_ID || "PREMIUM_123";

      let targetPlan: "free" | "pro" | "premium" = "free";
      let subStatus: "ativo" | "cancelado" | "atrasado" = "ativo";

      if (sale_status === "approved" || subscription_status === "active") {
        if (product_id === PREMIUM_PRODUCT_ID) {
          targetPlan = "premium";
        } else if (product_id === PRO_PRODUCT_ID) {
          targetPlan = "pro";
        }
        subStatus = "ativo";
      } 
      else if (sale_status === "refunded" || subscription_status === "canceled" || subscription_status === "expired") {
        targetPlan = "free";
        subStatus = "cancelado";
      }
      else if (subscription_status === "past_due") {
        subStatus = "atrasado";
      }

      if (targetPlan !== "free" || subStatus === "cancelado") {
        await supabaseService.updateProfile(us_id, {
          plan: targetPlan,
          subscription_status: subStatus
        });
        console.log(`User ${us_id} updated to plan ${targetPlan} with status ${subStatus}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed to custom to handle fallback manually
    });
    
    app.use(vite.middlewares);

    // SPA Fallback for development
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        // Read index.html
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        // Apply Vite HTML transforms
        template = await vite.transformIndexHtml(url, template);
        // Send the rendered HTML back
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
