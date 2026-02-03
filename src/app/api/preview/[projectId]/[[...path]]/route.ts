import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to get mime type
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html";
    case ".css": return "text/css";
    case ".js": return "application/javascript";
    case ".json": return "application/json";
    case ".png": return "image/png";
    case ".jpg": return "image/jpeg";
    case ".jpeg": return "image/jpeg";
    case ".svg": return "image/svg+xml";
    default: return "text/plain";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; path: string[] } }
) {
  const { projectId, path: pathSegments } = await params;

  const tempBase = path.join(os.tmpdir(), "ai-builder", projectId);
  const filePath = path.resolve(tempBase, ...(pathSegments || []));

  // Security check: ensure path stays within project directory
  if (!filePath.startsWith(tempBase)) {
      return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    // If it's a directory or doesn't exist, try index.html
    const indexHtml = path.join(filePath, "index.html");
    if (fs.existsSync(indexHtml)) {
        const content = fs.readFileSync(indexHtml);
        return new NextResponse(content, {
            headers: { "Content-Type": "text/html" }
        });
    }
    return new NextResponse("File not found", { status: 404 });
  }

  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
      const indexHtml = path.join(filePath, "index.html");
      if (fs.existsSync(indexHtml)) {
          const content = fs.readFileSync(indexHtml);
          return new NextResponse(content, {
              headers: { "Content-Type": "text/html" }
          });
      }
      return new NextResponse("Not Found", { status: 404 });
  }

  const content = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);

  return new NextResponse(content, {
    headers: {
      "Content-Type": mimeType,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
