import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Conversations
  app.get("/api/conversations", async (_req, res) => {
    const convs = await storage.getConversations();
    res.json(convs);
  });

  app.post("/api/conversations", async (req, res) => {
    const parsed = insertConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const conv = await storage.createConversation(parsed.data);
    res.json(conv);
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }
    const conv = await storage.updateConversationTitle(id, title);
    if (!conv) return res.status(404).json({ error: "not found" });
    res.json(conv);
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteConversation(id);
    res.json({ ok: true });
  });

  // Messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    const id = parseInt(req.params.id);
    const msgs = await storage.getMessages(id);
    res.json(msgs);
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    const conversationId = parseInt(req.params.id);
    const parsed = insertMessageSchema.safeParse({
      ...req.body,
      conversationId,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const msg = await storage.createMessage(parsed.data);
    res.json(msg);
  });

  return httpServer;
}
