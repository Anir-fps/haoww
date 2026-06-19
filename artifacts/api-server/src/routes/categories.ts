import { Router } from "express";
import { db } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.execute(`
    SELECT c.id, c.name, c.slug, c.icon_emoji,
           COUNT(p.id)::int as prompt_count
    FROM categories c
    LEFT JOIN prompts p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug, c.icon_emoji
    ORDER BY prompt_count DESC
  `);

  const categories = (rows.rows as Record<string, unknown>[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconEmoji: row.icon_emoji,
    promptCount: Number(row.prompt_count),
  }));

  return res.json(categories);
});

export default router;
