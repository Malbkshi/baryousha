import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { requireStaff } from "@/lib/auth";
import { backend } from "@/lib/env";
import { noStore } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/store";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const BUCKET = "menu";

const fail = (error: string, status: number) =>
  Response.json({ error }, { status, headers: noStore });

// Product photo upload from the dashboard. Returns the public URL.
export async function POST(request: Request) {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;

  let file: File | null = null;
  try {
    const entry = (await request.formData()).get("image");
    if (entry instanceof File) file = entry;
  } catch {
    return fail("invalid", 400);
  }
  if (!file || file.size === 0) return fail("no-file", 400);

  const extension = EXTENSION[file.type];
  if (!extension) return fail("unsupported-type", 400);
  if (file.size > MAX_BYTES) return fail("too-large", 400);

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, bytes, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      return Response.json({ url: data.publicUrl }, { headers: noStore });
    }

    if (backend() === "memory") {
      // Local development only: the deployed site's filesystem is read-only.
      const directory = path.join(process.cwd(), "public", "images");
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, `upload-${filename}`), bytes);
      return Response.json({ url: `/images/upload-${filename}` }, { headers: noStore });
    }

    return fail("server", 503);
  } catch (error) {
    console.error("Upload failed:", error);
    return fail("server", 503);
  }
}
