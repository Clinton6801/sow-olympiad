/**
 * POST /api/practice/certificate
 *
 * Create a certificate for practice mode completion
 * Calculates final score based on responses
 *
 * Body: { recipient_name, section_id, round_type, responses (map of questionId -> response) }
 * Returns: { success, certificate_id, score } or { error }
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
    const {
      recipient_name,
      section_id,
      round_type,
      responses,
    } = body;

    if (!recipient_name || !section_id || !round_type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: recipient_name, section_id, round_type",
        },
        { status: 400 }
      );
    }

    // Fetch all questions in the practice round
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("id, correct_answer, points")
      .eq("section_id", section_id)
      .eq("round_type", round_type)
      .limit(20);

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Calculate score
    let totalScore = 0;
    questions.forEach((q) => {
      if (responses && responses[q.id] === q.correct_answer) {
        totalScore += q.points || 1;
      }
    });

    // Create certificate
    const { data: certificate, error: certError } = await supabaseAdmin
      .from("certificates")
      .insert({
        recipient_name,
        section_id,
        mode: "practice",
        round_type,
        score: totalScore,
      })
      .select()
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate_id: certificate.id,
      score: totalScore,
    });
  } catch (error) {
    console.error("POST /api/practice/certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
