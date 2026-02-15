import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

// POST /api/upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "uploads"; // Default bucket
    const path = (formData.get("path") as string) || "";

    if (!file) {
      return NextResponse.json({ message: "Файл не найден" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the upload directory relative to the project root
    const uploadDir = join(process.cwd(), "public", bucket, path);

    // Ensure the directory exists
    await require("fs/promises").mkdir(uploadDir, { recursive: true });

    // Create a unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Write the file to the server's filesystem
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/${bucket}/${path ? `${path}/` : ""}${fileName}`;

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Ошибка загрузки файла:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
