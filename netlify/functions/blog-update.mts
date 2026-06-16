import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { db } from "../../db/index.js";
import { blogs } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

async function saveImages(files: File[]): Promise<string[]> {
  const store = getStore("blog-images");
  const keys: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    await store.set(key, buffer, { metadata: { contentType: file.type } });
    keys.push(key);
  }
  return keys;
}

export default async (req: Request, context: Context) => {
  const id = parseInt(context.params.id, 10);
  if (isNaN(id)) return new Response("Invalid ID", { status: 400 });

  const [existing] = await db.select().from(blogs).where(eq(blogs.id, id));
  if (!existing) return new Response("Not found", { status: 404 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;

  if (!title || !author || !category || !content) {
    return new Response("Missing required fields", { status: 400 });
  }

  const imageFiles = formData.getAll("images") as File[];
  const validImages = imageFiles.filter((f) => f instanceof File && f.size > 0);
  const newKeys = validImages.length ? await saveImages(validImages) : [];

  const existingKeys = existing.images ? existing.images.split(",") : [];
  const allKeys = [...existingKeys, ...newKeys];

  const [updated] = await db
    .update(blogs)
    .set({
      title,
      author,
      category,
      content,
      images: allKeys.length ? allKeys.join(",") : null,
    })
    .where(eq(blogs.id, id))
    .returning();

  return Response.json({ ...updated, images: allKeys });
};

export const config: Config = {
  path: "/api/blogs/:id",
  method: "PUT",
};
