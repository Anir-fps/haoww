import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: text("title"),
  text: text("text").notNull(),
  enhancedText: text("enhanced_text"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  categoryId: integer("category_id").notNull(),
  authorId: text("author_id"),
  copyCount: integer("copy_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isAdminCurated: boolean("is_admin_curated").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPromptSchema = createInsertSchema(promptsTable).omit({ id: true, copyCount: true, createdAt: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof promptsTable.$inferSelect;
