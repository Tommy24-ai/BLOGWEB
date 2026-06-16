import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { blogs } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (_req: Request, context: Context) => {
  const id = parseInt(context.params.id, 10);
  if (isNaN(id)) return new Response("Invalid ID", { status: 400 });

  const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
  if (!blog) return new Response("Not found", { status: 404 });

  await db.delete(blogs).where(eq(blogs.id, id));
  return new Response(null, { status: 204 });
};

export const config: Config = {
  path: "/api/blogs/:id",
  method: "DELETE",
};
