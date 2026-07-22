/**
 * POST /api/practice/submit-round
 * 
 * Server-side practice round grading and certificate creation.
 * Validates all answers and creates certificate record.
 * 
 * Body: { 
 *   student_name, 
 *   section_id, 
 *   round_type, 
 *   question_ids: string[], 
 *   responses: Record<index, answer>
 * }
 * Returns: { success, final_score, certificate_id } or { error }
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
    const { student_name, section_id, round_type, question_ids, responses } = body;

    // Validate input
    if (!student_name || !section_id || !round_type || !question_ids || !responses) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // IDEMPOTENCY CHECK: Prevent duplicate certificates
    // Check if a certificate with same recipient_name, section, round_type, and mode was created in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("recipient_name", student_name)
      .eq("section_id", section_id)
      .eq("round_type", round_type)
      .eq("mode", "practice")
      .gte("issued_at", tenSecondsAgo)
      .single();

    if (existingCert) {
      // Certificate already exists for this session, return it instead of creating a duplicate
      console.warn(`Duplicate certificate attempt prevented for ${student_name} in ${section_id}`);
      return NextResponse.json({
        success: true,
        final_score: 0, // We don't have the original score, but the cert already exists
        certificate_id: existingCert.id,
        answers: [],
      });
    }

    // Fetch all questions with correct answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("*")
      .in("id", question_ids);

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Grade all responses
    let finalScore = 0;
    const answers = [];

    question_ids.forEach((qId: string, idx: number) => {
      const question = questions.find((q) => q.id === qId);
      if (!question) return;

      const response = responses[idx];
      const isCorrect = response === question.correct_answer;
      const points = isCorrect ? (question.points || 1) : 0;

      finalScore += points;
      answers.push({
        question_id: qId,
        content: question.content,
        student_answer: response,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_awarded: points,
      });
    });

    // Create certificate
    const { data: certificate, error: certError } = await supabaseAdmin
      .from("certificates")
      .insert({
        recipient_name: student_name,
        section_id: section_id,
        mode: "practice",
        round_type: round_type,
        score: finalScore,
        issued_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      final_score: finalScore,
      certificate_id: certificate.id,
      answers: answers,
    });
  } catch (error) {
    console.error("POST /api/practice/submit-round error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
