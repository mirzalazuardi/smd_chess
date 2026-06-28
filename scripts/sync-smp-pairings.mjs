#!/usr/bin/env node
/**
 * sync-smp-pairings.mjs
 *
 * Creates tournament smd_pelajar_smp_20260628 and syncs round 1 pairings.
 * Reference: https://s2.chess-results.com/tnr1446791.aspx?lan=26&art=2&rd=1&SNode=S0
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ykbuemlpflvdpzamksww.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnVlbWxwZmx2ZHB6YW1rc3d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyODIxNSwiZXhwIjoyMDk2OTA0MjE1fQ.ah90LujSeAme4Pg1GSPHVO-FsX95LfB8W9_eXx2CzXw";

const ADMIN_ID = "17c89644-2fd2-4452-b875-f5da7b15a69f";
const TOURNAMENT_CODE = "smd_pelajar_smp_20260628";

// Chess-results.com starting rank (No → full name, cleaned)
const PLAYERS = {
  1: "Adam Miftahul Farid Basudewa",
  2: "Alief Al Arofi Basudewa",
  3: "Andhika Destian Saputra",
  4: "Aufaa Rafardhan Athaya",
  5: "Beni Fauzan",
  6: "Dafid Faturohman",
  7: "Dzaki Muhammad Kusuma",
  8: "Fadhil Dzahwa Aftiansyah",
  9: "Gani Aglasaka",
  10: "Gibran Ramadhan Haidir Arras",
  11: "Kiandra Azhar Febriansyah",
  12: "Lopa Rizky Renaldi",
  13: "Lutfi Sakhi Zaidan",
  14: "Lutvia Zulfa Nugraha",
  15: "M. Arfan Rayyandra Alvarizqy",
  16: "Muammad Fawaz Kailani Basudewa",
  17: "Muhammad Dzaky Muazzam",
  18: "Muhammad Fadhil Aldiansyah Zulfi",
  19: "Muhammad Faturrahman Al Ghifari",
  20: "Muhammad Furqon Kaysan",
  21: "Muhammad Indra Abi Sakti Ulumudi",
  22: "Muhammad Khoeru Azam Basudewa",
  23: "Muhammad Raja Alfallah",
  24: "Muhammad Rayhan Alfarizi Latif",
  25: "Nazran Alham Falah",
  26: "Nurani Maulida Putri",
  27: "Pangeran Rajendra Aliy Albar",
  28: "Rafa Budhi Fauzaan",
  29: "Rezvan Galen Arshad",
  30: "Rosalinda",
  31: "Steve Wiliam Fikry Abkhory",
  32: "Tafiatul Hermansyah",
  33: "Yasri Fitri Nur Maulina",
  34: "Zahira Khoirunisa Basudewa",
  35: "Zyan Arsyad Fadhlan Alfarizy",
};

// Chess-results.com Round 1 pairings [whiteNo, blackNo]
const PAIRINGS = [
  [18, 1], [2, 19], [20, 3], [4, 21], [22, 5], [6, 23],
  [24, 7], [8, 25], [26, 9], [10, 27], [28, 11], [12, 29],
  [30, 13], [14, 31], [32, 15], [16, 33], [34, 17],
];
// Player 35 gets BYE (no black opponent)

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ─── 1. Create tournament ────────────────────────────────────────────────
  console.log("🏆 Creating tournament...");
  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .insert({
      code: TOURNAMENT_CODE,
      name: "Piala Sekolah Insan Sejahtera - SMP",
      rounds_count: 5,
    })
    .select()
    .single();

  if (tErr) {
    console.error("❌ Create tournament failed:", tErr.message);
    process.exit(1);
  }
  console.log(`   ✅ ${tournament.name} (${tournament.code}) → ${tournament.id}\n`);

  const tournamentId = tournament.id;

  // ─── 2. Add all 35 players ───────────────────────────────────────────────
  console.log("👥 Adding 35 players...");
  const registrations = [];

  for (let i = 1; i <= 35; i++) {
    const { data: reg, error: rErr } = await supabase
      .from("registrations")
      .insert({
        tournament_id: tournamentId,
        registration_id: `CATUR2026-${String(137 + i).padStart(3, "0")}`,
        full_name: PLAYERS[i],
        student_status: "pelajar",
        paid: true,
        is_active: true,
        payment_verified_at: new Date().toISOString(),
        payment_verified_by: ADMIN_ID,
      })
      .select("id, full_name")
      .single();

    if (rErr) {
      console.error(`   ❌ #${i} ${PLAYERS[i]}: ${rErr.message}`);
    } else {
      registrations.push(reg);
      if (i <= 3 || i >= 33) console.log(`   ✅ #${i} ${reg.full_name}`);
    }
  }

  // Build No → ID map
  const noToId = new Map();
  for (let i = 0; i < registrations.length; i++) {
    noToId.set(i + 1, registrations[i].id);
  }

  console.log(`\n   ${registrations.length}/35 players added`);

  // ─── 3. Create round 1 ──────────────────────────────────────────────────
  console.log("\n📋 Creating round 1...");
  const { data: round, error: roundErr } = await supabase
    .from("tournament_rounds")
    .insert({
      tournament_id: tournamentId,
      round_number: 1,
      status: "ongoing",
    })
    .select()
    .single();

  if (roundErr) {
    console.error("❌ Create round failed:", roundErr.message);
    process.exit(1);
  }
  console.log(`   ✅ Round 1 created (${round.id})`);

  // ─── 4. Insert matches ──────────────────────────────────────────────────
  const matchesToInsert = [];

  for (let i = 0; i < PAIRINGS.length; i++) {
    const [whiteNo, blackNo] = PAIRINGS[i];
    matchesToInsert.push({
      round_id: round.id,
      player1_id: noToId.get(whiteNo),
      player2_id: noToId.get(blackNo),
      table_no: i + 1,
      status: "pending",
      player1_score: null,
      player2_score: null,
    });
  }

  // BYE: player 35
  matchesToInsert.push({
    round_id: round.id,
    player1_id: noToId.get(35),
    player2_id: null,
    table_no: null,
    status: "completed",
    player1_score: 1,
    player2_score: null,
  });

  const { data: created, error: mErr } = await supabase
    .from("matches")
    .insert(matchesToInsert)
    .select("table_no, player1_id, player2_id, status");

  if (mErr) {
    console.error("❌ Insert matches failed:", mErr.message);
    process.exit(1);
  }

  // ─── 5. Display ─────────────────────────────────────────────────────────
  console.log(`💾 Inserted ${created.length} matches\n`);

  const sorted = created.sort((a, b) => (a.table_no ?? 999) - (b.table_no ?? 999));

  // Expected from chess-results
  const expected = {
    1: ["Muhammad Fadhil Aldiansyah Zulfi", "Adam Miftahul Farid Basudewa"],
    2: ["Alief Al Arofi Basudewa", "Muhammad Faturrahman Al Ghifari"],
    3: ["Muhammad Furqon Kaysan", "Andhika Destian Saputra"],
    4: ["Aufaa Rafardhan Athaya", "Muhammad Indra Abi Sakti Ulumudi"],
    5: ["Muhammad Khoeru Azam Basudewa", "Beni Fauzan"],
    6: ["Dafid Faturohman", "Muhammad Raja Alfallah"],
    7: ["Muhammad Rayhan Alfarizi Latif", "Dzaki Muhammad Kusuma"],
    8: ["Fadhil Dzahwa Aftiansyah", "Nazran Alham Falah"],
    9: ["Nurani Maulida Putri", "Gani Aglasaka"],
    10: ["Gibran Ramadhan Haidir Arras", "Pangeran Rajendra Aliy Albar"],
    11: ["Rafa Budhi Fauzaan", "Kiandra Azhar Febriansyah"],
    12: ["Lopa Rizky Renaldi", "Rezvan Galen Arshad"],
    13: ["Rosalinda", "Lutfi Sakhi Zaidan"],
    14: ["Lutvia Zulfa Nugraha", "Steve Wiliam Fikry Abkhory"],
    15: ["Tafiatul Hermansyah", "M. Arfan Rayyandra Alvarizqy"],
    16: ["Muammad Fawaz Kailani Basudewa", "Yasri Fitri Nur Maulina"],
    17: ["Zahira Khoirunisa Basudewa", "Muhammad Dzaky Muazzam"],
  };

  let pass = 0, fail = 0;
  for (const m of sorted.filter((m) => m.table_no !== null)) {
    const w = registrations.find((r) => r.id === m.player1_id)?.full_name ?? "?";
    const b = registrations.find((r) => r.id === m.player2_id)?.full_name ?? "?";
    const exp = expected[m.table_no];

    if (w === exp[0] && b === exp[1]) {
      pass++;
    } else {
      console.log(`❌ Meja ${m.table_no}: "${w}" vs "${b}"`);
      console.log(`   expected: "${exp[0]}" vs "${exp[1]}"`);
      fail++;
    }
  }

  // BYE check
  const bye = sorted.find((m) => m.table_no === null);
  const byeName = registrations.find((r) => r.id === bye?.player1_id)?.full_name;
  console.log(`\n   BYE: ${byeName}`);

  console.log(`\n🎯 ${pass}/${pass + fail} boards match chess-results.com`);
  console.log(`🔗 https://smd-chess.vercel.app/admin/ronde/${tournamentId}`);
}

main().catch((err) => {
  console.error("❌ Unexpected:", err);
  process.exit(1);
});
