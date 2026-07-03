/**
 * POST /api/rooms/[code]/end-round
 * 
 * Admin-triggered endpoint to end a round and create certificates for all participants.
 * Called by host when round completes or time expires.
 * 
 * Body: { adminCode?: string } (optional admin verification)
 * Returns: { success, certificates_created } or { error }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: roomCode } = await params;

    // 1. Verify room exists and is active
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("id, section_id, round_type, status")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "active") {
      return NextResponse.json(
        { error: "Room is not active" },
        { status: 400 }
      );
    }

    // 2. Get all participants in room
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from("room_participants")
      .select("id, student_name, live_score")
      .eq("room_id", room.id);

    if (participantsError) {
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    // 3. Create certificate for each participant (if not already created)
    const certificateIds: string[] = [];

    for (const participant of participants || []) {
      // Check if certificate already exists for this participant
      const { data: existingCert } = await supabaseAdmin
        .from("certificates")
        .select("id")
        .eq("room_participant_id", participant.id)
        .single();

      if (!existingCert) {
        // Create new certificate
        const { data: newCert, error: certError } = await supabaseAdmin
          .from("certificates")
          .insert({
            recipient_name: participant.student_name,
            section_id: room.section_id,
            mode: "competition",
            round_type: room.round_type,
            score: participant.live_score,
            room_id: room.id,
            room_participant_id: participant.id,
            issued_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (!certError && newCert) {
          certificateIds.push(newCert.id);
        }
      } else {
        certificateIds.push(existingCert.id);
      }
    }

    // 4. Update room status to completed
    const { error: updateError } = await supabaseAdmin
      .from("rooms")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", room.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update room status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificates_created: certificateIds.length,
      certificate_ids: certificateIds,
    });
  } catch (error) {
    console.error("POST /api/rooms/[code]/end-round error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
