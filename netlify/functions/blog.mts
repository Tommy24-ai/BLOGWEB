import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { blogs } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  const id = parseInt(context.params.id, 10);
  if (isNaN(id)) return new Response("Invalid ID", { status: 400 });

  if (req.method === "GET") {
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    if (!blog) return new Response("Not found", { status: 404 });
    return Response.json({ ...blog, images: blog.images ? blog.images.split(",") : [] });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/blogs/:id",
  method: "GET",
};
