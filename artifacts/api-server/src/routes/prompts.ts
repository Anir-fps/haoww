import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, promptsTable, usersTable, promptLikesTable } from "@workspace/db";

function safeGetAuth(req: Parameters<typeof getAuth>[0]): { userId: string | null } {
  try {
    return getAuth(req);
  } catch {
    return { userId: null };
  }
}
import { eq, sql, and } from "drizzle-orm";

const router = Router();

function formatPrompt(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    enhancedText: row.enhanced_text,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    categoryId: row.category_id,
    categoryName: row.category_name || "Uncategorized",
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    copyCount: row.copy_count,
    likeCount: Number(row.like_count ?? 0),
    isLikedByMe: row.is_liked_by_me === true || row.is_liked_by_me === "true",
    isFeatured: row.is_featured,
    isAdminCurated: row.is_admin_curated,
    tags: row.tags || [],
    createdAt: row.created_at,
  };
}

function baseQuery(clerkId?: string) {
  const likeJoin = clerkId
    ? `LEFT JOIN prompt_likes pl_me ON pl_me.prompt_id = p.id AND pl_me.clerk_id = '${clerkId.replace(/'/g, "''")}'`
    : "";
  const isLikedCol = clerkId
    ? "CASE WHEN pl_me.id IS NOT NULL THEN true ELSE false END as is_liked_by_me,"
    : "false as is_liked_by_me,";
  return `
    SELECT p.*, c.name as category_name,
           u.username as author_name, u.avatar_url as author_avatar_url,
           ${isLikedCol}
           (SELECT COUNT(*) FROM prompt_likes pl WHERE pl.prompt_id = p.id) as like_count
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.clerk_id
    ${likeJoin}
  `;
}

// GET /prompts
router.get("/", async (req, res) => {
  const { userId } = safeGetAuth(req);
  const { category, search, sort = "newest", page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let where = "WHERE 1=1";
  if (category) where += ` AND c.slug = '${category.replace(/'/g, "''")}'`;
  if (search) where += ` AND (p.text ILIKE '%${search.replace(/'/g, "''")}%' OR p.title ILIKE '%${search.replace(/'/g, "''")}%')`;

  const orderMap: Record<string, string> = {
    newest: "p.created_at DESC",
    trending: "p.copy_count DESC",
    featured: "p.is_featured DESC, p.created_at DESC",
  };
  const orderBy = orderMap[sort] || "p.created_at DESC";

  const rows = await db.execute(`${baseQuery(userId ?? undefined)} ${where} ORDER BY ${orderBy} LIMIT ${limitNum} OFFSET ${offset}`);
  const countResult = await db.execute(`SELECT COUNT(*) as count FROM prompts p LEFT JOIN categories c ON p.category_id = c.id ${where}`);

  return res.json({
    prompts: (rows.rows as Record<string, unknown>[]).map(formatPrompt),
    total: Number((countResult.rows[0] as { count: string }).count),
    page: pageNum,
    limit: limitNum,
  });
});

// POST /prompts
router.post("/", async (req, res) => {
  const { userId } = safeGetAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { title, text, enhancedText, imageUrl, videoUrl, categoryId, tags } = req.body as {
    title?: string; text: string; enhancedText?: string;
    imageUrl?: string; videoUrl?: string; categoryId: number; tags?: string[];
  };

  const [prompt] = await db.insert(promptsTable).values({
    title: title || null,
    text,
    enhancedText: enhancedText || null,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    categoryId,
    authorId: userId,
    tags: tags || [],
  }).returning();

  const row = await db.execute(`${baseQuery(userId)} WHERE p.id = ${prompt.id}`);
  return res.status(201).json(formatPrompt(row.rows[0] as Record<string, unknown>));
});

// GET /prompts/featured
router.get("/featured", async (req, res) => {
  const { userId } = safeGetAuth(req);
  const limit = Math.min(50, parseInt((req.query.limit as string) || "8"));
  const rows = await db.execute(`${baseQuery(userId ?? undefined)} WHERE p.is_featured = true ORDER BY p.created_at DESC LIMIT ${limit}`);
  return res.json((rows.rows as Record<string, unknown>[]).map(formatPrompt));
});

// GET /prompts/trending
router.get("/trending", async (req, res) => {
  const { userId } = safeGetAuth(req);
  const limit = Math.min(50, parseInt((req.query.limit as string) || "10"));
  const rows = await db.execute(`${baseQuery(userId ?? undefined)} ORDER BY p.copy_count DESC LIMIT ${limit}`);
  return res.json((rows.rows as Record<string, unknown>[]).map(formatPrompt));
});

// GET /prompts/:id
router.get("/:id", async (req, res) => {
  const { userId } = safeGetAuth(req);
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const rows = await db.execute(`${baseQuery(userId ?? undefined)} WHERE p.id = ${id}`);
  if (!rows.rows[0]) return res.status(404).json({ error: "Not found" });
  return res.json(formatPrompt(rows.rows[0] as Record<string, unknown>));
});

// PATCH /prompts/:id
router.patch("/:id", async (req, res) => {
  const { userId } = safeGetAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(promptsTable).where(eq(promptsTable.id, id)).limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  const isAdmin = user[0]?.isAdmin ?? false;
  if (existing[0].authorId !== userId && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { title, text, enhancedText, imageUrl, videoUrl, categoryId, isFeatured, isAdminCurated, tags } = req.body as Record<string, unknown>;
  const updates: Partial<typeof promptsTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title as string;
  if (text !== undefined) updates.text = text as string;
  if (enhancedText !== undefined) updates.enhancedText = enhancedText as string;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl as string;
  if (videoUrl !== undefined) updates.videoUrl = videoUrl as string;
  if (categoryId !== undefined) updates.categoryId = categoryId as number;
  if (isFeatured !== undefined && isAdmin) updates.isFeatured = isFeatured as boolean;
  if (isAdminCurated !== undefined && isAdmin) updates.isAdminCurated = isAdminCurated as boolean;
  if (tags !== undefined) updates.tags = tags as string[];

  await db.update(promptsTable).set(updates).where(eq(promptsTable.id, id));
  const row = await db.execute(`${baseQuery(userId)} WHERE p.id = ${id}`);
  return res.json(formatPrompt(row.rows[0] as Record<string, unknown>));
});

// DELETE /prompts/:id
router.delete("/:id", async (req, res) => {
  const { userId } = safeGetAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(promptsTable).where(eq(promptsTable.id, id)).limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  const isAdmin = user[0]?.isAdmin ?? false;
  if (existing[0].authorId !== userId && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  await db.delete(promptsTable).where(eq(promptsTable.id, id));
  return res.status(204).send();
});

// POST /prompts/:id/copy
router.post("/:id/copy", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(promptsTable).where(eq(promptsTable.id, id)).limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(promptsTable)
    .set({ copyCount: sql`${promptsTable.copyCount} + 1` })
    .where(eq(promptsTable.id, id))
    .returning();

  return res.json({
    text: updated.text,
    enhancedText: updated.enhancedText,
    copyCount: updated.copyCount,
  });
});

// POST /prompts/:id/like  — toggle like
router.post("/:id/like", async (req, res) => {
  const { userId } = safeGetAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(promptsTable).where(eq(promptsTable.id, id)).limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  const existingLike = await db.select().from(promptLikesTable)
    .where(and(eq(promptLikesTable.promptId, id), eq(promptLikesTable.clerkId, userId)))
    .limit(1);

  let isLikedByMe: boolean;
  if (existingLike[0]) {
    await db.delete(promptLikesTable)
      .where(and(eq(promptLikesTable.promptId, id), eq(promptLikesTable.clerkId, userId)));
    isLikedByMe = false;
  } else {
    await db.insert(promptLikesTable).values({ promptId: id, clerkId: userId });
    isLikedByMe = true;
  }

  const countResult = await db.execute(
    `SELECT COUNT(*) as like_count FROM prompt_likes WHERE prompt_id = ${id}`,
  );
  const likeCount = Number((countResult.rows[0] as { like_count: string }).like_count);

  return res.json({ likeCount, isLikedByMe });
});

// POST /prompts/:id/feature
router.post("/:id/feature", async (req, res) => {
  const { userId } = safeGetAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user[0]?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(promptsTable).where(eq(promptsTable.id, id)).limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Not found" });

  await db.update(promptsTable)
    .set({ isFeatured: !existing[0].isFeatured })
    .where(eq(promptsTable.id, id));

  const row = await db.execute(`${baseQuery(userId)} WHERE p.id = ${id}`);
  return res.json(formatPrompt(row.rows[0] as Record<string, unknown>));
});

export default router;
