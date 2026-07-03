/**
 * POST /api/rooms/[code]/answer
 * 
 * Server-side answer validation and scoring.
 * Prevents client-side manipulation of scores.
 * 
 * Body: { participant_id, question_id, response, time_taken_seconds? }
 * Returns: { is_correct, points_awarded, updated_score } or { error }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recordAnswerServerSide, getParticipant } from "@/lib/db-server";

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
    const { participant_id, question_id, response, time_taken_seconds } = body;

    // 1. Validate input
    if (!participant_id || !question_id || response === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, question_id, response" },
        { status: 400 }
      );
    }

    // 2. Verify room exists and is active
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("id, status")
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

    // 3. Verify participant is in room and belongs to this room
    const participant = await getParticipant(participant_id);
    if (!participant || participant.room_id !== room.id) {
      return NextResponse.json(
        { error: "Participant not found in this room" },
        { status: 403 }
      );
    }

    // 4. Verify question exists
    const { data: question, error: questionError } = await supabaseAdmin
      .from("questions")
      .select("id")
      .eq("id", question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 5. Record answer server-side with validation
    const result = await recordAnswerServerSide(
      participant_id,
      question_id,
      response,
      time_taken_seconds
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // 6. Return result (correct/incorrect status and updated score ONLY, never send correct_answer)
    return NextResponse.json({
      success: true,
      is_correct: result.is_correct,
      points_awarded: result.points_awarded,
      updated_score: result.updated_score,
    });
  } catch (error) {
    console.error("POST /api/rooms/[code]/answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
