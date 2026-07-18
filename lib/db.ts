import { supabase, getServerSupabase } from "./supabase";

// Types - CLIENT-SAFE (NO correct_answer exposed)
export interface Section {
  id: string;
  name: string;
  description?: string;
  grade_range?: string;
  tier_color: string;
  icon_name?: string;
  display_order?: number;
}

export interface Question {
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
  points: number;
  // NOTE: correct_answer NEVER included in client-facing responses
}

export interface QuestionWithCorrectAnswer extends Question {
  correct_answer: string;
  // Server-only type used only in server-side API routes
}

export interface Room {
  id: string;
  code: string;
  section_id: string;
  round_type: "grid" | "tiered" | "sprint";
  status: "waiting" | "active" | "completed";
  time_limit_seconds?: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
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

export interface RoomQuestion {
  id: string;
  room_id: string;
  question_id: string;
  cell_index?: number;
  position?: number;
  claimed_by_participant_id?: string;
  claimed_at?: string;
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

export interface Certificate {
  id: string;
  recipient_name: string;
  section_id: string;
  mode: "practice" | "competition";
  round_type?: "grid" | "tiered" | "sprint";
  score: number;
  issued_at: string;
}

// Sections
export async function getSection(id: string): Promise<Section | null> {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("getSection error:", error);
  return data;
}

export async function getAllSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) console.error("getAllSections error:", error);
  return data || [];
}

// Questions - CLIENT FUNCTIONS (NO correct_answer)
export async function getQuestionsBySection(
  sectionId: string,
  roundType: "grid" | "tiered" | "sprint",
  difficulty?: "easy" | "medium" | "hard"
): Promise<Question[]> {
  let query = supabase
    .from("questions")
    .select(
      "id, section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, points"
    ) // NOTE: correct_answer NOT selected
    .eq("section_id", sectionId)
    .eq("round_type", roundType);

  if (difficulty) {
    query = query.eq("difficulty_tier", difficulty);
  }

  const { data, error } = await query;
  if (error) console.error("getQuestionsBySection error:", error);
  return data || [];
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, section_id, round_type, difficulty_tier, content, answer_type, option_a, option_b, option_c, option_d, points"
    ) // NOTE: correct_answer NOT selected
    .eq("id", id)
    .single();
  if (error) console.error("getQuestionById error:", error);
  return data;
}

// Rooms
export async function createRoom(
  roundType: "grid" | "tiered" | "sprint",
  sectionId: string,
  timeLimitSeconds?: number
): Promise<Room | null> {
  const code = generateRoomCode();

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      code,
      section_id: sectionId,
      round_type: roundType,
      time_limit_seconds: timeLimitSeconds,
      status: "waiting",
      created_by_admin: true,
    })
    .select()
    .single();

  if (error) console.error("createRoom error:", error);
  return data;
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .single();
  if (error) console.error("getRoomByCode error:", error);
  return data;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("getRoomById error:", error);
  return data;
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Room Participants
export async function addRoomParticipant(
  roomId: string,
  studentName: string
): Promise<RoomParticipant | null> {
  const { data, error } = await supabase
    .from("room_participants")
    .insert({ room_id: roomId, student_name: studentName })
    .select()
    .single();
  if (error) console.error("addRoomParticipant error:", error);
  return data;
}

export async function getRoomParticipants(
  roomId: string
): Promise<RoomParticipant[]> {
  const { data, error } = await supabase
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId);
  if (error) console.error("getRoomParticipants error:", error);
  return data || [];
}

// Leaderboard - CLIENT CAN READ (Realtime subscriptions)
export async function getRoomLeaderboard(roomId: string): Promise<RoomParticipant[]> {
  const { data, error } = await supabase
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId)
    .order("live_score", { ascending: false });
  if (error) console.error("getRoomLeaderboard error:", error);
  return data || [];
}

// Room Questions - CLIENT CAN READ (for displaying grid and questions)
export async function getRoomQuestions(roomId: string): Promise<RoomQuestion[]> {
  const { data, error } = await supabase
    .from("room_questions")
    .select("*")
    .eq("room_id", roomId)
    .order("cell_index", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true, nullsFirst: false });
  if (error) console.error("getRoomQuestions error:", error);
  return data || [];
}

export async function getRoomQuestionByCellIndex(
  roomId: string,
  cellIndex: number
): Promise<RoomQuestion | null> {
  const { data, error } = await supabase
    .from("room_questions")
    .select("*")
    .eq("room_id", roomId)
    .eq("cell_index", cellIndex)
    .single();
  if (error) console.error("getRoomQuestionByCellIndex error:", error);
  return data;
}

// NOTE: recordAnswer() removed from client-side exports
// All answer recording must go through server API routes only

// Certificates
export async function createCertificate(
  recipientName: string,
  sectionId: string,
  mode: "practice" | "competition",
  roundType: string,
  score: number,
  roomId?: string,
  roomParticipantId?: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      recipient_name: recipientName,
      section_id: sectionId,
      mode,
      round_type: roundType,
      score,
      room_id: roomId,
      room_participant_id: roomParticipantId,
    })
    .select()
    .single();

  if (error) console.error("createCertificate error:", error);
  return data;
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("getCertificate error:", error);
  return data;
}

// Admin functions removed - now using direct environment variable comparison in /api/auth/login
