import { deleteFile } from "@/backend/api/files/delete";

/** DELETE /api/files/[fileId] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  return deleteFile(fileId);
}
