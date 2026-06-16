import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (_req: Request, context: Context) => {
  const key = context.params.key;
  if (!key) return new Response("Missing key", { status: 400 });

  const store = getStore("blog-images");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

  if (!result) return new Response("Image not found", { status: 404 });

  const contentType = (result.metadata?.contentType as string) || "image/jpeg";
  return new Response(result.data as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = {
  path: "/api/image/:key",
  method: "GET",
};
