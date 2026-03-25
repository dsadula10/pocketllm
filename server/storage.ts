import {
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversationTitle(id: number, title: string): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<void>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.id)).all();
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return db.select().from(conversations).where(eq(conversations.id, id)).get();
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    return db.insert(conversations).values(conv).returning().get();
  }

  async updateConversationTitle(id: number, title: string): Promise<Conversation | undefined> {
    return db.update(conversations).set({ title }).where(eq(conversations.id, id)).returning().get();
  }

  async deleteConversation(id: number): Promise<void> {
    db.delete(messages).where(eq(messages.conversationId, id)).run();
    db.delete(conversations).where(eq(conversations.id, id)).run();
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).all();
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    return db.insert(messages).values(msg).returning().get();
  }
}

export const storage = new DatabaseStorage();
