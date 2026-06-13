import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { TvPairingView } from "./tv-pairing-view";

interface MatchRow {
  id: string;
  table_no: number | null;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
}

interface Props {
  params: Promise<{ code: string; round: string }>;
}

export default async function TvPairingPage({ params }: Props) {
  const { code, round } = await params;
  const roundNumber = parseInt(round, 10);

  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, code, name, rounds_count")
    .eq("code", code)
    .single();

  if (!tournament) notFound();

  const { data: roundData } = await supabase
    .from("tournament_rounds")
    .select("id, round_number, status")
    .eq("tournament_id", tournament.id)
    .eq("round_number", roundNumber)
    .single();

  if (!roundData) notFound();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, table_no, player1_id, player2_id, player1_score, player2_score, status")
    .eq("round_id", roundData.id)
    .order("table_no", { ascending: true, nullsFirst: false });

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name")
    .eq("tournament_id", tournament.id)
    .eq("paid", true)
    .eq("is_active", true);

  const nameMap = new Map(registrations?.map((r) => [r.id, r.full_name]) ?? []);

  const { data: prevRound } = await supabase
    .from("tournament_rounds")
    .select("round_number")
    .eq("tournament_id", tournament.id)
    .eq("round_number", roundNumber - 1)
    .maybeSingle();

  const { data: nextRound } = await supabase
    .from("tournament_rounds")
    .select("round_number")
    .eq("tournament_id", tournament.id)
    .eq("round_number", roundNumber + 1)
    .maybeSingle();

  const matchData = (matches as MatchRow[] | null)?.map((m) => ({
    id: m.id,
    table_no: m.table_no,
    player1_id: m.player1_id,
    player2_id: m.player2_id,
    player1_name: nameMap.get(m.player1_id) ?? m.player1_id.slice(0, 8),
    player2_name: m.player2_id ? nameMap.get(m.player2_id) ?? m.player2_id.slice(0, 8) : null,
    player1_score: m.player1_score,
    player2_score: m.player2_score,
  })) ?? [];

  return (
    <TvPairingView
      tournamentName={tournament.name}
      tournamentCode={tournament.code}
      roundNav={{
        prev: prevRound ? roundNumber - 1 : null,
        current: roundNumber,
        next: nextRound ? roundNumber + 1 : null,
      }}
      matches={matchData}
    />
  );
}

export const dynamic = "force-dynamic";
