/**
 * POST /api/practice/answer
 *
 * Server-side answer validation for practice mode
 * Returns whether answer is correct (never exposes correct_answer to client)
 *
 * Body: { question_id, response }
 * Returns: { success, is_correct } or { error }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id, response } = body;

    if (!question_id || response === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: question_id, response" },
        { status: 400 }
      );
    }

    // Fetch question with correct answer (server-side only)
    const { data: question, error: questionError } = await supabaseAdmin
      .from("questions")
      .select("correct_answer, points")
      .eq("id", question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if answer is correct
    const isCorrect = response === question.correct_answer;
    const pointsAwarded = isCorrect ? question.points : 0;

    return NextResponse.json({
      success: true,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    });
  } catch (error) {
    console.error("POST /api/practice/answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
