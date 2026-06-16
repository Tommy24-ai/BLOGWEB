import type { Config } from "@netlify/functions";
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

export default async (req: Request) => {
  if (req.method === "GET") {
    const rows = await db.select().from(blogs);
    const result = rows.map((b) => ({
      ...b,
      images: b.images ? b.images.split(",") : [],
    }));
    return Response.json(result);
  }

  if (req.method === "POST") {
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
    const imageKeys = validImages.length ? await saveImages(validImages) : [];

    const [blog] = await db
      .insert(blogs)
      .values({
        title,
        author,
        category,
        content,
        images: imageKeys.length ? imageKeys.join(",") : null,
      })
      .returning();

    return Response.json({ ...blog, images: imageKeys }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/blogs",
};
