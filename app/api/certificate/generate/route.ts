/**
 * POST /api/certificate/generate
 * 
 * Server-side certificate generation stub.
 * For production, use a service like https://pdf-api.io or convert client-side.
 * This endpoint returns a simple JSON indicating the certificate is ready.
 * 
 * Body: { certificateId }
 * Returns: { success, certificateId }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCertificate } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json(
        { error: "certificateId required" },
        { status: 400 }
      );
    }

    // Verify certificate exists
    const certificate = await getCertificate(certificateId);
    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // For now, return success - certificate is displayed via canvas on client
    // For production PNG export, integrate with external service or use server rendering
    return NextResponse.json({
      success: true,
      certificateId,
      message: "Certificate ready for download",
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: "Failed to process certificate" },
      { status: 500 }
    );
  }
}
