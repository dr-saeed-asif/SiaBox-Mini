import { verifyFile } from "@/backend/api/files/verify";

/** POST /api/files/[fileId]/verify */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  return verifyFile(fileId);
}
