import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const categories = [
  { name: "Photorealistic", slug: "photorealistic", icon_emoji: "📷" },
  { name: "Cinematic", slug: "cinematic", icon_emoji: "🎬" },
  { name: "Illustration", slug: "illustration", icon_emoji: "🎨" },
  { name: "Fantasy", slug: "fantasy", icon_emoji: "🧙" },
  { name: "Sci-Fi", slug: "sci-fi", icon_emoji: "🚀" },
  { name: "Portrait", slug: "portrait", icon_emoji: "👤" },
  { name: "Architecture", slug: "architecture", icon_emoji: "🏛️" },
  { name: "Nature", slug: "nature", icon_emoji: "🌿" },
];

const prompts = [
  {
    title: "Golden Hour Forest",
    text: "A misty ancient forest at golden hour, shafts of warm light piercing through towering redwood trees, soft bokeh background, ultra-realistic, photographic, 8k resolution, Canon EOS R5",
    category: "photorealistic",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    tags: ["forest", "golden hour", "nature", "realistic"],
    is_featured: true,
    like_count: 342,
    copy_count: 891,
  },
  {
    title: "Cyberpunk Alley Rain",
    text: "Neon-lit cyberpunk alley at night, heavy rain reflecting neon signs in puddles, lone figure in a trench coat, cinematic composition, volumetric fog, Blade Runner aesthetic, moody atmosphere",
    category: "cinematic",
    image_url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
    tags: ["cyberpunk", "neon", "rain", "cinematic"],
    is_featured: true,
    like_count: 521,
    copy_count: 1240,
  },
  {
    title: "Fantasy Castle Cliff",
    text: "Majestic fantasy castle perched on dramatic sea cliffs at sunset, waterfalls cascading down, dragons circling distant peaks, epic scale, digital matte painting, highly detailed, concept art",
    category: "fantasy",
    image_url: "https://images.unsplash.com/photo-1520637836862-4d197d17c38a?w=800&q=80",
    tags: ["castle", "fantasy", "epic", "dragons"],
    is_featured: true,
    like_count: 489,
    copy_count: 1102,
  },
  {
    title: "Studio Portrait Light",
    text: "Elegant female portrait, dramatic Rembrandt lighting, deep shadows, pearl jewelry, vintage Hollywood glamour, medium format film photography, shallow depth of field, grain texture",
    category: "portrait",
    image_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
    tags: ["portrait", "dramatic", "lighting", "glamour"],
    is_featured: false,
    like_count: 276,
    copy_count: 634,
  },
  {
    title: "Space Station Orbit",
    text: "Massive orbital space station above glowing Earth, detailed mechanical structure, solar panels catching sunlight, astronaut doing spacewalk, photorealistic CGI, volumetric atmosphere glow, 4K",
    category: "sci-fi",
    image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80",
    tags: ["space", "sci-fi", "station", "orbit"],
    is_featured: true,
    like_count: 608,
    copy_count: 1532,
  },
  {
    title: "Watercolor Garden",
    text: "Enchanted secret garden, loose watercolor illustration, blooming wisteria arch, stone path, morning light, botanical art style, warm pastel palette, detailed flowers, dreamy atmosphere",
    category: "illustration",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    tags: ["watercolor", "garden", "illustration", "pastel"],
    is_featured: false,
    like_count: 198,
    copy_count: 445,
  },
  {
    title: "Brutalist Architecture",
    text: "Striking brutalist concrete architecture, geometric forms, dramatic overcast sky, low-angle perspective, black and white photography, architectural photography, strong shadows, mid-century modern",
    category: "architecture",
    image_url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    tags: ["brutalist", "concrete", "architecture", "monochrome"],
    is_featured: false,
    like_count: 157,
    copy_count: 312,
  },
  {
    title: "Aurora Borealis Lake",
    text: "Breathtaking aurora borealis over a perfectly still mountain lake, vivid greens and purples reflected in mirror-like water, snow-capped peaks, starry sky, long exposure, landscape photography",
    category: "nature",
    image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
    tags: ["aurora", "night", "lake", "reflection"],
    is_featured: true,
    like_count: 892,
    copy_count: 2341,
  },
  {
    title: "Desert Dunes Sunrise",
    text: "Rolling Saharan sand dunes at sunrise, long shadows creating abstract patterns, camel caravan silhouette on the horizon, warm golden tones, aerial perspective, fine art photography, minimalist",
    category: "photorealistic",
    image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    tags: ["desert", "dunes", "sunrise", "minimalist"],
    is_featured: false,
    like_count: 234,
    copy_count: 567,
  },
  {
    title: "Epic Movie Chase",
    text: "High-speed car chase through narrow European streets, motion blur, cinematic wide angle, sparks flying, wet cobblestones reflecting headlights, tense atmosphere, film grain, anamorphic lens flare",
    category: "cinematic",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    tags: ["cinematic", "action", "car", "chase"],
    is_featured: false,
    like_count: 312,
    copy_count: 789,
  },
  {
    title: "Dragon Rider Sky",
    text: "Warrior riding a colossal iridescent dragon above storm clouds, lightning crackling in the background, epic battle composition, dynamic pose, detailed scales, fantasy concept art, Greg Rutkowski style",
    category: "fantasy",
    image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
    tags: ["dragon", "warrior", "epic", "fantasy"],
    is_featured: true,
    like_count: 743,
    copy_count: 1876,
  },
  {
    title: "Analog Film Portrait",
    text: "Candid street portrait on analog film, Kodak Portra 400, natural window light, authentic expression, slightly grainy, soft focus background, warm tones, documentary photography style",
    category: "portrait",
    image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
    tags: ["film", "analog", "portrait", "candid"],
    is_featured: false,
    like_count: 421,
    copy_count: 934,
  },
  {
    title: "Alien Planet Landscape",
    text: "Alien planet with twin suns setting over a vast crystalline desert, strange purple vegetation, bioluminescent plants glowing at dusk, vast alien ruins in distance, photorealistic sci-fi, cinematic lighting",
    category: "sci-fi",
    image_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
    tags: ["alien", "planet", "sci-fi", "bioluminescent"],
    is_featured: false,
    like_count: 387,
    copy_count: 901,
  },
  {
    title: "Art Nouveau Poster",
    text: "Art Nouveau decorative illustration, elegant woman surrounded by flowing botanical motifs, gold leaf accents, intricate border patterns, Alphonse Mucha inspired, rich jewel tones, vintage poster style",
    category: "illustration",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    tags: ["art nouveau", "vintage", "poster", "Mucha"],
    is_featured: true,
    like_count: 556,
    copy_count: 1234,
  },
  {
    title: "Japanese Temple Mist",
    text: "Ancient Japanese pagoda in misty bamboo forest, cherry blossoms falling, koi pond in foreground, peaceful and serene, soft morning light, traditional architecture, ultra-detailed, photorealistic",
    category: "architecture",
    image_url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    tags: ["japan", "temple", "mist", "cherry blossom"],
    is_featured: true,
    like_count: 671,
    copy_count: 1567,
  },
  {
    title: "Macro Water Droplets",
    text: "Extreme macro photograph of water droplets on a vibrant flower petal, each droplet refracting a tiny landscape, f/2.8 aperture, ring flash lighting, 1:1 magnification, razor-sharp focus",
    category: "nature",
    image_url: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80",
    tags: ["macro", "water", "droplets", "flower"],
    is_featured: false,
    like_count: 189,
    copy_count: 423,
  },
  {
    title: "Underwater City Ruins",
    text: "Sunken ancient city beneath crystal-clear tropical waters, sunbeams filtering down through the ocean surface, colorful coral growing on marble columns, sea turtles swimming past, photorealistic underwater photography",
    category: "sci-fi",
    image_url: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80",
    tags: ["underwater", "ruins", "ocean", "ancient"],
    is_featured: false,
    like_count: 445,
    copy_count: 1023,
  },
  {
    title: "Ink Splash Portrait",
    text: "Dynamic ink splash portrait, half-face emerging from black ink explosion, dramatic contrast, high-speed photography aesthetic, editorial style, monochromatic with red ink accent, conceptual art",
    category: "illustration",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
    tags: ["ink", "splash", "portrait", "monochrome"],
    is_featured: false,
    like_count: 312,
    copy_count: 678,
  },
  {
    title: "Snowy Mountain Peak",
    text: "Dramatic Himalayan mountain peak at blue hour, jagged ridgeline against deep blue sky, lone mountaineer silhouette near summit, storm clouds building, extreme landscape photography, telephoto compression",
    category: "nature",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    tags: ["mountain", "snow", "himalaya", "adventure"],
    is_featured: true,
    like_count: 534,
    copy_count: 1189,
  },
  {
    title: "Retro Futurism City",
    text: "1960s retro-futurism cityscape, flying cars on elevated highways, dome-covered buildings, optimistic color palette of turquoise and orange, streamlined architecture, vintage sci-fi illustration style",
    category: "sci-fi",
    image_url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    tags: ["retro", "futurism", "city", "1960s"],
    is_featured: false,
    like_count: 267,
    copy_count: 612,
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catIdMap: Record<string, number> = {};
    for (const cat of categories) {
      const existing = await client.query(
        "SELECT id FROM categories WHERE slug = $1",
        [cat.slug],
      );
      if (existing.rows.length > 0) {
        catIdMap[cat.slug] = existing.rows[0].id;
      } else {
        const result = await client.query(
          "INSERT INTO categories (name, slug, icon_emoji) VALUES ($1, $2, $3) RETURNING id",
          [cat.name, cat.slug, cat.icon_emoji],
        );
        catIdMap[cat.slug] = result.rows[0].id;
      }
    }

    let inserted = 0;
    let skipped = 0;
    for (const p of prompts) {
      const catId = catIdMap[p.category];
      if (!catId) {
        console.warn(`No category found for slug: ${p.category}`);
        continue;
      }

      const existing = await client.query(
        "SELECT id FROM prompts WHERE title = $1 AND category_id = $2",
        [p.title, catId],
      );
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO prompts (title, text, image_url, category_id, copy_count, like_count, is_featured, is_admin_curated, tags, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          p.title,
          p.text,
          p.image_url,
          catId,
          p.copy_count,
          p.like_count,
          p.is_featured,
          p.is_featured,
          `{${p.tags.map((t) => `"${t}"`).join(",")}}`,
        ],
      );
      inserted++;
    }

    await client.query("COMMIT");
    console.log(`Done. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
