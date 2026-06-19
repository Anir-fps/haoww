import { pgTable, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const promptLikesTable = pgTable("prompt_likes", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  promptId: integer("prompt_id").notNull(),
  clerkId: text("clerk_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.promptId, t.clerkId)]);
