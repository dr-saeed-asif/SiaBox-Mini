import { createRecoveryKey } from "@/backend/api/files/recovery-key";

/** POST /api/files/[fileId]/recovery-key */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  return createRecoveryKey(fileId);
}
