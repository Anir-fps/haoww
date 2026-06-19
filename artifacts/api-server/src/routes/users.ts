import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/sync", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const clerkUser = (req as unknown as { auth?: { sessionClaims?: Record<string, unknown> } }).auth?.sessionClaims;
  const username =
    (clerkUser?.["username"] as string | undefined) ||
    (clerkUser?.["email"] as string | undefined)?.split("@")[0] ||
    null;
  const avatarUrl = (clerkUser?.["image_url"] as string | undefined) || null;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [user] = existing;
    const promptCount = await db.execute(
      `SELECT COUNT(*) as count FROM prompts WHERE author_id = '${userId}'`,
    );
    return res.json({
      ...user,
      promptCount: Number((promptCount.rows[0] as { count: string }).count),
    });
  }

  const [user] = await db
    .insert(usersTable)
    .values({ clerkId: userId, username, avatarUrl })
    .returning();

  return res.json({ ...user, promptCount: 0 });
});

router.get("/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await db.execute(
    `SELECT COUNT(*) as count FROM prompts WHERE author_id = '${userId}'`,
  );
  const promptCount = Number(
    (result.rows[0] as { count: string }).count,
  );

  return res.json({ ...user, promptCount });
});

router.patch("/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: "username required" });

  const [updated] = await db
    .update(usersTable)
    .set({ username })
    .where(eq(usersTable.clerkId, userId))
    .returning();

  return res.json({ ...updated, promptCount: 0 });
});

router.get("/me/prompts", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db.execute(`
    SELECT p.*, c.name as category_name,
           u.username as author_name, u.avatar_url as author_avatar_url
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.clerk_id
    WHERE p.author_id = '${userId}'
    ORDER BY p.created_at DESC
  `);

  const prompts = (rows.rows as Record<string, unknown>[]).map((row) => ({
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
    isFeatured: row.is_featured,
    isAdminCurated: row.is_admin_curated,
    tags: row.tags || [],
    createdAt: row.created_at,
  }));

  return res.json(prompts);
});

export default router;
