import { uploadFile } from "@/backend/api/files/upload";

/** POST /api/files/upload */
export async function POST(request: Request) {
  return uploadFile(request);
}
