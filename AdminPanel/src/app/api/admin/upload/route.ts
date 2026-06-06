import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";

// Cloudinary uses the CLOUDINARY_URL environment variable automatically
cloudinary.config({
  secure: true
});

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "products.images.upload");
  if (guard.response) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 Data URI
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${file.type || 'image/jpeg'};base64,${base64Image}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'quirkyhome/builder',
      resource_type: 'auto'
    });

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "upload",
      action: "create",
      entityType: "media",
      entityLabel: file.name || uploadResponse.secure_url,
      message: "Uploaded media to Cloudinary.",
      metadata: {
        fileName: file.name || null,
        mimeType: file.type || null,
        url: uploadResponse.secure_url,
      },
    });

    // Return the secure URL from Cloudinary
    return NextResponse.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
