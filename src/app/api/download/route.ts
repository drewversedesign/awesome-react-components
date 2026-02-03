import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import JSZip from "jszip";

export async function GET(
  req: NextRequest,
) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  const tempBase = path.join(os.tmpdir(), "ai-builder");
  const projectDir = path.resolve(tempBase, projectId);

  // Security check
  if (!projectDir.startsWith(tempBase)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(projectDir)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const zip = new JSZip();

  function addFilesToZip(dir: string, zipFolder: JSZip) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        addFilesToZip(filePath, zipFolder.folder(file)!);
      } else {
        const content = fs.readFileSync(filePath);
        zipFolder.file(file, content);
      }
    });
  }

  addFilesToZip(projectDir, zip);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${projectId}.zip"`,
    },
  });
}
