import { deleteFile } from "@/backend/api/files/delete";

/** DELETE /api/files/[fileId] — remove from the app, not from Sia */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  return deleteFile(request, fileId);
}
