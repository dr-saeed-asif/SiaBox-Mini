import { downloadFile } from "@/backend/api/files/download";

/** GET /api/files/[fileId]/download */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  return downloadFile(fileId);
}
