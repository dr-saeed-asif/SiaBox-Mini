import { NextResponse } from "next/server";

/** Standard JSON success response */
export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Standard JSON error response with a clear message for beginners */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
