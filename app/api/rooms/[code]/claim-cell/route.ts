/**
 * POST /api/rooms/[code]/claim-cell
 * 
 * Grid Round: Server-side cell claim with answer validation.
 * Prevents race conditions and score manipulation.
 * 
 * Body: { participant_id, room_question_id, response }
 * Returns: { success, is_correct, points_awarded } or { error }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { claimGridCellServerSide, getParticipant } from "@/lib/db-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: roomCode } = await params;
    const body = await request.json();
    const { participant_id, room_question_id, response } = body;

    // 1. Validate input
    if (!participant_id || !room_question_id || response === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, room_question_id, response" },
        { status: 400 }
      );
    }

    // 2. Verify room exists, is active, and is a grid round
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("id, status, round_type")
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

    if (room.round_type !== "grid") {
      return NextResponse.json(
        { error: "This endpoint is only for grid rounds" },
        { status: 400 }
      );
    }

    // 3. Verify participant is in room
    const participant = await getParticipant(participant_id);
    if (!participant || participant.room_id !== room.id) {
      return NextResponse.json(
        { error: "Participant not found in this room" },
        { status: 403 }
      );
    }

    // 4. Verify room_question exists and belongs to this room
    const { data: roomQuestion, error: rqError } = await supabaseAdmin
      .from("room_questions")
      .select("id, room_id")
      .eq("id", room_question_id)
      .single();

    if (rqError || !roomQuestion || roomQuestion.room_id !== room.id) {
      return NextResponse.json(
        { error: "Question cell not found in this room" },
        { status: 404 }
      );
    }

    // 5. Claim cell with server-side answer validation
    const result = await claimGridCellServerSide(
      participant_id,
      room_question_id,
      response
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: result.success,
      is_correct: result.is_correct,
      points_awarded: result.points_awarded,
    });
  } catch (error) {
    console.error("POST /api/rooms/[code]/claim-cell error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
