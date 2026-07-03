/**
 * Server-side database functions using Supabase service role key.
 * These MUST ONLY be called from server-side API routes (app/api/**).
 * NEVER expose or call these from client-side code.
 * 
 * The service role key has full access to the database and bypasses RLS,
 * allowing us to enforce business logic server-side.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Service role client - ONLY for server-side use
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Type definitions
export interface QuestionWithCorrectAnswer {
  id: string;
  section_id: string;
  round_type: "grid" | "tiered" | "sprint";
  difficulty_tier?: "easy" | "medium" | "hard";
  content: string;
  answer_type: "mcq" | "numeric";
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  points: number;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  student_name: string;
  live_score: number;
  final_score?: number;
  answers_submitted: number;
  correct_answers: number;
}

export interface Answer {
  id: string;
  room_participant_id: string;
  question_id: string;
  response: string;
  is_correct: boolean;
  points_awarded: number;
  time_taken_seconds?: number;
}

export interface AnswerSubmissionResult {
  is_correct: boolean;
  points_awarded: number;
  updated_score: number;
  correct_answer?: string; // Only returned to admin/debugging, NOT to students
}

export interface RoomQuestion {
  id: string;
  room_id: string;
  question_id: string;
  cell_index?: number; // 0-24 for Grid, null for Tiered/Sprint
  position?: number; // 1-20 for Tiered/Sprint, null for Grid
  claimed_by_participant_id?: string;
  claimed_at?: string;
}

// SERVER-ONLY: Get question with correct answer (never send to client as-is)
export async function getQuestionByIdWithAnswer(
  id: string
): Promise<QuestionWithCorrectAnswer | null> {
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getQuestionByIdWithAnswer error:", error);
    return null;
  }

  return data;
}

// SERVER-ONLY: Record answer and update score atomically
export async function recordAnswerServerSide(
  participantId: string,
  questionId: string,
  response: string,
  timeTakenSeconds?: number
): Promise<AnswerSubmissionResult | { error: string }> {
  try {
    // 1. Get the question with correct answer (server-only)
    const question = await getQuestionByIdWithAnswer(questionId);
    if (!question) {
      return { error: "Question not found" };
    }

    // 2. Validate the response
    let isCorrect = false;

    if (question.answer_type === "mcq") {
      // For MCQ, response must match one of the options exactly
      const validOptions = [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ].filter(Boolean);

      isCorrect =
        validOptions.includes(response) &&
        response === question.correct_answer;
    } else if (question.answer_type === "numeric") {
      // For numeric, parse and compare with tolerance for floating point
      const responseNum = parseFloat(response);
      const correctNum = parseFloat(question.correct_answer);

      if (!isNaN(responseNum) && !isNaN(correctNum)) {
        // Allow small floating-point tolerance
        isCorrect = Math.abs(responseNum - correctNum) < 0.0001;
      }
    }

    const pointsAwarded = isCorrect ? question.points : 0;

    // 3. Insert answer record (server-side using service role key)
    const { error: answerError } = await supabaseAdmin
      .from("answers")
      .insert({
        room_participant_id: participantId,
        question_id: questionId,
        response,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
        time_taken_seconds: timeTakenSeconds,
      });

    if (answerError) {
      console.error("Failed to insert answer:", answerError);
      return { error: "Failed to record answer" };
    }

    // 4. Update participant score and answer counts (atomic update)
    const { data: participantData, error: participantError } =
      await supabaseAdmin
        .from("room_participants")
        .select("live_score, correct_answers, answers_submitted")
        .eq("id", participantId)
        .single();

    if (participantError || !participantData) {
      console.error("Failed to get participant:", participantError);
      return { error: "Failed to update score" };
    }

    const updatedScore = (participantData.live_score || 0) + pointsAwarded;
    const updatedCorrectAnswers =
      (participantData.correct_answers || 0) + (isCorrect ? 1 : 0);
    const updatedAnswersSubmitted =
      (participantData.answers_submitted || 0) + 1;

    const { error: updateError } = await supabaseAdmin
      .from("room_participants")
      .update({
        live_score: updatedScore,
        correct_answers: updatedCorrectAnswers,
        answers_submitted: updatedAnswersSubmitted,
      })
      .eq("id", participantId);

    if (updateError) {
      console.error("Failed to update participant score:", updateError);
      return { error: "Failed to update score" };
    }

    return {
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      updated_score: updatedScore,
    };
  } catch (error) {
    console.error("recordAnswerServerSide error:", error);
    return { error: "Internal server error" };
  }
}

// SERVER-ONLY: Claim grid cell with answer validation
export async function claimGridCellServerSide(
  participantId: string,
  roomQuestionId: string,
  response: string
): Promise<
  { success: boolean; is_correct: boolean; points_awarded: number } | { error: string }
> {
  try {
    // 1. Get room question to find the question_id
    const { data: roomQuestion, error: rqError } = await supabaseAdmin
      .from("room_questions")
      .select("*")
      .eq("id", roomQuestionId)
      .single();

    if (rqError || !roomQuestion) {
      return { error: "Room question not found" };
    }

    // 2. Check if already claimed
    if (roomQuestion.claimed_by_participant_id) {
      return { error: "Cell already claimed" };
    }

    // 3. Get question with correct answer
    const question = await getQuestionByIdWithAnswer(roomQuestion.question_id);
    if (!question) {
      return { error: "Question not found" };
    }

    // 4. Validate answer server-side
    let isCorrect = false;

    if (question.answer_type === "mcq") {
      const validOptions = [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ].filter(Boolean);
      isCorrect =
        validOptions.includes(response) &&
        response === question.correct_answer;
    } else if (question.answer_type === "numeric") {
      const responseNum = parseFloat(response);
      const correctNum = parseFloat(question.correct_answer);
      if (!isNaN(responseNum) && !isNaN(correctNum)) {
        isCorrect = Math.abs(responseNum - correctNum) < 0.0001;
      }
    }

    const pointsAwarded = isCorrect ? question.points : 0;

    // 5. Record the answer
    const { error: answerError } = await supabaseAdmin
      .from("answers")
      .insert({
        room_participant_id: participantId,
        question_id: roomQuestion.question_id,
        response,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      })
      .single();

    if (answerError) {
      console.error("Failed to insert answer:", answerError);
      return { error: "Failed to record answer" };
    }

    // 6. If correct, claim the cell and update score
    if (isCorrect) {
      // Update room_questions to mark as claimed
      const claimSuccess = await updateRoomQuestionClaimed(
        roomQuestionId,
        participantId
      );

      if (!claimSuccess) {
        return { error: "Failed to claim cell" };
      }

      // Update participant score
      const { data: participantData } = await supabaseAdmin
        .from("room_participants")
        .select("live_score, correct_answers, answers_submitted")
        .eq("id", participantId)
        .single();

      if (participantData) {
        const updatedScore = (participantData.live_score || 0) + pointsAwarded;
        const updatedCorrectAnswers =
          (participantData.correct_answers || 0) + 1;
        const updatedAnswersSubmitted =
          (participantData.answers_submitted || 0) + 1;

        await supabaseAdmin
          .from("room_participants")
          .update({
            live_score: updatedScore,
            correct_answers: updatedCorrectAnswers,
            answers_submitted: updatedAnswersSubmitted,
          })
          .eq("id", participantId);
      }
    } else {
      // On incorrect answer, increment attempts_submitted but don't claim cell
      const { data: participantData } = await supabaseAdmin
        .from("room_participants")
        .select("answers_submitted")
        .eq("id", participantId)
        .single();

      if (participantData) {
        await supabaseAdmin
          .from("room_participants")
          .update({
            answers_submitted: (participantData.answers_submitted || 0) + 1,
          })
          .eq("id", participantId);
      }
    }

    return {
      success: true,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    };
  } catch (error) {
    console.error("claimGridCellServerSide error:", error);
    return { error: "Internal server error" };
  }
}

// SERVER-ONLY: Get room with participant to validate ownership
export async function getRoomWithParticipants(roomId: string) {
  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError) return { error: "Room not found" };

  const { data: participants, error: participantsError } = await supabaseAdmin
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId);

  if (participantsError) return { error: "Failed to fetch participants" };

  return { room, participants };
}

// SERVER-ONLY: Verify participant is in room
export async function getParticipant(
  participantId: string
): Promise<RoomParticipant | null> {
  const { data, error } = await supabaseAdmin
    .from("room_participants")
    .select("*")
    .eq("id", participantId)
    .single();

  if (error) {
    console.error("getParticipant error:", error);
    return null;
  }

  return data;
}

// SERVER-ONLY: Create room questions (called when admin creates a room)
// For Grid: Selects 25 random questions, assigns to cells 0-24
// For Tiered/Sprint: Selects 20 random questions, assigns position 1-20
export async function createRoomQuestions(
  roomId: string,
  sectionId: string,
  roundType: "grid" | "tiered" | "sprint"
): Promise<RoomQuestion[] | null> {
  try {
    // Determine how many questions to select
    const questionCount = roundType === "grid" ? 25 : 20;

    // Fetch random questions from the section's question pool for this round type
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("id")
      .eq("section_id", sectionId)
      .eq("round_type", roundType)
      .order("random()")
      .limit(questionCount);

    if (questionsError || !questions || questions.length === 0) {
      console.error(
        `Not enough questions for ${roundType} round in section ${sectionId}`
      );
      return null;
    }

    // Build insert data
    const roomQuestionsData = questions.map((q, index) => ({
      room_id: roomId,
      question_id: q.id,
      cell_index: roundType === "grid" ? index : null, // 0-24 for grid
      position: roundType !== "grid" ? index + 1 : null, // 1-20 for tiered/sprint
    }));

    // Insert all room questions at once
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("room_questions")
      .insert(roomQuestionsData)
      .select();

    if (insertError) {
      console.error("Failed to create room questions:", insertError);
      return null;
    }

    return insertedData;
  } catch (error) {
    console.error("createRoomQuestions error:", error);
    return null;
  }
}

// SERVER-ONLY: Get room question by cell index (for Grid rounds)
export async function getRoomQuestionByCell(
  roomId: string,
  cellIndex: number
): Promise<RoomQuestion | null> {
  const { data, error } = await supabaseAdmin
    .from("room_questions")
    .select("*")
    .eq("room_id", roomId)
    .eq("cell_index", cellIndex)
    .single();

  if (error) {
    console.error("getRoomQuestionByCell error:", error);
    return null;
  }

  return data;
}

// SERVER-ONLY: Get room question by position (for Tiered/Sprint rounds)
export async function getRoomQuestionByPosition(
  roomId: string,
  position: number
): Promise<RoomQuestion | null> {
  const { data, error } = await supabaseAdmin
    .from("room_questions")
    .select("*")
    .eq("room_id", roomId)
    .eq("position", position)
    .single();

  if (error) {
    console.error("getRoomQuestionByPosition error:", error);
    return null;
  }

  return data;
}

// SERVER-ONLY: Get all room questions for a room (for grid display)
export async function getRoomAllQuestions(
  roomId: string
): Promise<RoomQuestion[] | null> {
  const { data, error } = await supabaseAdmin
    .from("room_questions")
    .select("*")
    .eq("room_id", roomId)
    .order(
      "cell_index",
      { ascending: true, nullsFirst: false }
    ) // Grid cells first, then by position
    .order("position", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("getRoomAllQuestions error:", error);
    return null;
  }

  return data;
}

// SERVER-ONLY: Claim grid cell (update room_questions row)
export async function updateRoomQuestionClaimed(
  roomQuestionId: string,
  participantId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("room_questions")
    .update({
      claimed_by_participant_id: participantId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", roomQuestionId);

  if (error) {
    console.error("Failed to update room question claimed:", error);
    return false;
  }

  return true;
}
