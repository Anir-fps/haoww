import { Router } from "express";
import { db } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  const [totals] = (
    await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM prompts)::int as total_prompts,
      (SELECT COALESCE(SUM(copy_count), 0) FROM prompts)::int as total_copies,
      (SELECT COUNT(*) FROM users)::int as total_users,
      (SELECT COUNT(*) FROM prompts WHERE is_featured = true)::int as featured_count
  `)
  ).rows as Record<string, number>[];

  const catRows = await db.execute(`
    SELECT c.id, c.name, c.slug, c.icon_emoji,
           COUNT(p.id)::int as prompt_count
    FROM categories c
    LEFT JOIN prompts p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug, c.icon_emoji
    ORDER BY prompt_count DESC
    LIMIT 6
  `);

  const topCategories = (catRows.rows as Record<string, unknown>[]).map(
    (row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      iconEmoji: row.icon_emoji,
      promptCount: Number(row.prompt_count),
    }),
  );

  return res.json({
    totalPrompts: totals.total_prompts,
    totalCopies: totals.total_copies,
    totalUsers: totals.total_users,
    featuredCount: totals.featured_count,
    topCategories,
  });
});

export default router;
