/**
 * GET /api/practice/questions
 * 
 * Fetches random questions for a practice round.
 * Uses server-side Supabase client with randomization.
 * 
 * Query params:
 *   - section_id: string (required)
 *   - round_type: 'grid' | 'tiered' | 'sprint' (required)
 *   - difficulty: 'easy' | 'medium' | 'hard' (optional, for tiered rounds)
 * 
 * Returns: { questions: Question[] } or { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("section_id");
    const roundType = searchParams.get("round_type") as "grid" | "tiered" | "sprint" | null;
    const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;

    if (!sectionId || !roundType) {
      return NextResponse.json(
        { error: "Missing required parameters: section_id, round_type" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from("questions")
      .select(
        "id, section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, points"
      ) // NOTE: correct_answer NOT selected
      .eq("section_id", sectionId)
      .eq("round_type", roundType);

    if (difficulty) {
      query = query.eq("difficulty_tier", difficulty);
    }

    // Fetch all questions (or a large batch)
    const { data: allQuestions, error } = await query;

    if (error) {
      console.error("Failed to fetch questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({
        questions: [],
      });
    }

    // Shuffle array using Fisher-Yates algorithm
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Branch on round type:
    // - Grid/Tiered: return exactly 20 questions (fixed set per session)
    // - Sprint: return full shuffled pool (answer as many as possible before time runs out)
    if (roundType === 'sprint') {
      // Sprint: return all available questions (full pool)
      return NextResponse.json({
        questions: shuffled,
      });
    } else {
      // Grid/Tiered: return first 20 randomized questions
      return NextResponse.json({
        questions: shuffled.slice(0, 20),
      });
    }
  } catch (error) {
    console.error("GET /api/practice/questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
