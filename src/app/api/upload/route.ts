import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();

  // Dev fallback: return a base64 data URL when Cloudinary isn't configured
  if (!cloudinaryConfigured) {
    const base64 = Buffer.from(bytes).toString("base64");
    const url = `data:${file.type};base64,${base64}`;
    return Response.json({ url });
  }

  const buffer = Buffer.from(bytes);
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "wishly/gifts", resource_type: "image" }, (err, res) => {
        if (err || !res) reject(err ?? new Error("Upload failed"));
        else resolve(res as { secure_url: string });
      })
      .end(buffer);
  });

  return Response.json({ url: result.secure_url });
}
