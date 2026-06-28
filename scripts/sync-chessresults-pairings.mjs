#!/usr/bin/env node
/**
 * sync-chessresults-pairings.mjs
 *
 * Syncs round 1 pairings from chess-results.com into SMD Chess database.
 * Uses Supabase service role for direct database access.
 *
 * Usage:
 *   node scripts/sync-chessresults-pairings.mjs
 *
 * Chess-results reference:
 *   https://s1.chess-results.com/tnr1446734.aspx?lan=26&art=2&rd=1&SNode=S0
 *
 * Tournament: 61557f5e-59c7-4cb2-946e-bcdf072f0400
 */

import { createClient } from "@supabase/supabase-js";

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = "https://ykbuemlpflvdpzamksww.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnVlbWxwZmx2ZHB6YW1rc3d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyODIxNSwiZXhwIjoyMDk2OTA0MjE1fQ.ah90LujSeAme4Pg1GSPHVO-FsX95LfB8W9_eXx2CzXw";

const TOURNAMENT_ID = "61557f5e-59c7-4cb2-946e-bcdf072f0400";

// ─── Chess-results.com starting rank list (No → Name) ────────────────────────

const CHESS_RESULTS_PLAYERS = {
  1: "Aan",
  2: "Abo",
  3: "Adang, Mahfud",
  4: "Ade, Penho",
  5: "Ade, Saryana",
  6: "Adhi",
  7: "Adot",
  8: "Agi",
  9: "Agus",
  10: "Agus, Petir",
  11: "Alban",
  12: "Aos", // ⚠️ NOT in DB
  13: "Asep",
  14: "Asep, Agug",
  15: "Asep, Naryadi",
  16: "Asep, Yana Yustiana",
  17: "Asep, Yayat",
  18: "Ayah, Eruk", // ⚠️ NOT in DB
  19: "Azka, Zahr Ardiansan",
  20: "Bayu, Anggara",
  21: "Bos, Eshade",
  22: "Budi",
  23: "Budi., Bpr", // ⚠️ NOT in DB
  24: "Caca",
  25: "Cece",
  26: "Cecep",
  27: "Cucu",
  28: "Dadi, Ciawitali",
  29: "Dahlia",
  30: "Dana",
  31: "Dede, Bpn",
  32: "Dede, Ismawan",
  33: "Deden, Dosen",
  34: "Deni, Firmansyah",
  35: "Dicky, Herdiansyah",
  36: "Didi, Suhrowardi",
  37: "Doot",
  38: "Edo",
  39: "Elano, Taufik",
  40: "Emon",
  41: "Entep",
  42: "Frengky, Steve",
  43: "Gustaf",
  44: "H., Naruchi",
  45: "Handika",
  46: "Ilham, Ahmad Dinejad",
  47: "Imat, Sutisna",
  48: "Iva",
  49: "Jajang, Nurjaman",
  50: "Jajat, Sudrajat",
  51: "Jali",
  52: "Komara",
  53: "M., Wardani",
  54: "Ogi",
  55: "Rafika, Adnur",
  56: "Roy, Khan",
  57: "Sopian",
  58: "Suharma",
  59: "Sukandi",
  60: "Tatang",
  61: "Tedy, Dragon",
  62: "Teguh",
  63: "Toto",
  64: "Ucin",
  65: "Usef",
  66: "Ustd, Eman",
  67: "Yadi",
  68: "YADI, KAWANI, Musyadad",
  69: "Yakub",
  70: "Yogi",
  71: "Yuyus, Abdilah",
  72: "Zalfa, Ghifari Ap",
  73: "Zalfa, Xavi",
  74: "BAYU RIZKI ANGGIANA",
};

// ─── Chess-results.com Round 1 pairings [whiteNo, blackNo] ───────────────────

const CHESS_RESULTS_PAIRINGS = [
  [1, 39],  [40, 2],  [3, 41],  [42, 4],  [5, 43],  [44, 6],
  [7, 45],  [46, 8],  [9, 47],  [48, 10], [11, 49], [50, 12],
  [13, 51], [52, 14], [15, 53], [54, 16], [17, 55], [56, 18],
  [19, 57], [58, 20], [21, 59], [60, 22], [23, 61], [62, 24],
  [25, 63], [64, 26], [27, 65], [66, 28], [29, 67], [68, 30],
  [31, 36], [32, 69], [70, 33], [34, 71], [72, 35], [37, 73],
  [74, 38],
];

// ─── Known name overrides (chess-results name → expected DB full_name) ───────

const NAME_OVERRIDES = {
  "Dadi, Ciawitali": "Dadi Ciawi Tali",
  "YADI, KAWANI, Musyadad": "Riko Musyadad",
  "Yuyus, Abdilah": "Yuyus Abdillah",
  "BAYU RIZKI ANGGIANA": "Bayu Rizky Anggiana",
};

// ─── Helper: normalize a name for matching ───────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[,.]/g, "") // remove commas and dots
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

// ─── Helper: fuzzy match chess-results name to DB registration ───────────────

function matchPlayer(crName, registrations, usedIds) {
  const norm = normalizeName(crName);

  // Try exact match first (already normalized)
  let best = registrations.find(
    (r) => normalizeName(r.full_name) === norm && !usedIds.has(r.id),
  );
  if (best) return best;

  // Try: DB name contains chess-results name (full word match preferred)
  // Must be a meaningful match — avoid "Budi" matching "Budi. Bpr" since both exist
  const crWords = norm.split(" ").filter(Boolean);
  for (const reg of registrations) {
    if (usedIds.has(reg.id)) continue;
    const regNorm = normalizeName(reg.full_name);

    // Require ALL words of the shorter name to be in the longer name
    // AND the shorter name must be at least half the length (avoid trivial substring)
    const regWords = regNorm.split(" ").filter(Boolean);
    const shorterWords = crWords.length <= regWords.length ? crWords : regWords;
    const longerWords = crWords.length <= regWords.length ? regWords : crWords;

    const shorterLen = Math.min(norm.length, regNorm.length);
    const longerLen = Math.max(norm.length, regNorm.length);

    // All shorter words must appear in longer words
    const allWordsMatch = shorterWords.every((w) => longerWords.includes(w));
    // Shorter must be at least 60% of longer length (avoid "Budi" matching "Budi Bpr")
    const substantialMatch = shorterLen >= longerLen * 0.6;

    if (allWordsMatch && substantialMatch) {
      best = reg;
      break; // first good match wins
    }
  }

  return best ?? null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("🔍 Fetching paid/active registrations...");
  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("id, full_name")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("paid", true)
    .eq("is_active", true);

  if (regError) {
    console.error("❌ Failed to fetch registrations:", regError.message);
    process.exit(1);
  }

  console.log(`   Found ${registrations.length} paid/active players\n`);

  // Apply name overrides for known edge cases
  for (const [crName, dbName] of Object.entries(NAME_OVERRIDES)) {
    const match = registrations.find((r) => r.full_name === dbName);
    if (match) {
      console.log(`🔧 Override: "${crName}" → "${dbName}" (${match.id.slice(0, 8)}...)`);
    }
  }

  // Build mapping: chess-results No → DB registration ID
  const crNoToDbId = new Map();
  const unmatched = [];
  const usedDbIds = new Set(); // prevent same DB player from matching multiple CR numbers

  for (const [noStr, crName] of Object.entries(CHESS_RESULTS_PLAYERS)) {
    const no = parseInt(noStr);

    // Check override first
    if (NAME_OVERRIDES[crName]) {
      const match = registrations.find((r) => r.full_name === NAME_OVERRIDES[crName]);
      if (match && !usedDbIds.has(match.id)) {
        crNoToDbId.set(no, match.id);
        usedDbIds.add(match.id);
        continue;
      }
    }

    const match = matchPlayer(crName, registrations, usedDbIds);
    if (match) {
      crNoToDbId.set(no, match.id);
      usedDbIds.add(match.id);
    } else {
      unmatched.push({ no, crName });
    }
  }

  // Find DB players not mapped to any chess-results number
  const mappedIds = new Set(crNoToDbId.values());
  const unmappedDbPlayers = registrations.filter((r) => !mappedIds.has(r.id));

  console.log(`✅ Mapped: ${crNoToDbId.size}/${Object.keys(CHESS_RESULTS_PLAYERS).length}`);
  if (unmatched.length > 0) {
    console.log(`⚠️  Unmatched (not in DB):`, unmatched.map((u) => `#${u.no} "${u.crName}"`).join(", "));
  }
  if (unmappedDbPlayers.length > 0) {
    console.log(`📋 Extra in DB (not in chess-results):`, unmappedDbPlayers.map((p) => `"${p.full_name}"`).join(", "));
  }

  // ─── Build final pairings ──────────────────────────────────────────────────

  const validPairings = [];
  const orphanedPlayers = []; // players whose chess-results opponent is missing

  for (const [whiteNo, blackNo] of CHESS_RESULTS_PAIRINGS) {
    const whiteId = crNoToDbId.get(whiteNo);
    const blackId = crNoToDbId.get(blackNo);

    if (whiteId && blackId) {
      validPairings.push([whiteId, blackId]);
    } else if (whiteId && !blackId) {
      orphanedPlayers.push(whiteId);
    } else if (!whiteId && blackId) {
      orphanedPlayers.push(blackId);
    }
    // both missing → skip entirely
  }

  console.log(`\n📊 Valid pairings: ${validPairings.length}`);
  console.log(`🔄 Orphaned players: ${orphanedPlayers.length}`);
  console.log(`➕ Extra DB players: ${unmappedDbPlayers.length}`);

  // Pair orphans + extra players together
  const unpaired = [...orphanedPlayers, ...unmappedDbPlayers.map((p) => p.id)];

  if (unpaired.length % 2 !== 0) {
    console.error(`❌ Odd number of unpaired players (${unpaired.length}) — cannot create pairings`);
    process.exit(1);
  }

  // Pair them: first half vs second half
  const half = unpaired.length / 2;
  for (let i = 0; i < half; i++) {
    validPairings.push([unpaired[i], unpaired[i + half]]);
  }

  if (unpaired.length > 0) {
    console.log(`🔀 Added ${half} extra board(s) for orphaned/extra players`);
  }

  // Collect all player IDs in final pairings
  const pairedIds = new Set(validPairings.flat());
  const allDbIds = new Set(registrations.map((r) => r.id));

  const missing = [...allDbIds].filter((id) => !pairedIds.has(id));
  if (missing.length > 0) {
    console.error(`❌ ${missing.length} player(s) not included in any pairing:`);
    for (const id of missing) {
      const reg = registrations.find((r) => r.id === id);
      console.error(`   - ${reg?.full_name ?? id}`);
    }
    process.exit(1);
  }

  console.log(`\n📋 Final: ${validPairings.length} boards, ${pairedIds.size} players`);

  // ─── Get or create round 1 ────────────────────────────────────────────────

  console.log("\n🔍 Checking existing rounds...");
  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("id, round_number, status")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("round_number", 1)
    .order("round_number");

  let roundId;

  if (rounds && rounds.length > 0) {
    roundId = rounds[0].id;
    console.log(`   Found round 1 (${roundId}), status: ${rounds[0].status}`);

    // Check if round has results — don't overwrite
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("player1_score, player2_score")
      .eq("round_id", roundId);

    const hasResults = existingMatches?.some(
      (m) => m.player1_score !== null || m.player2_score !== null,
    );

    if (hasResults) {
      console.error("❌ Round 1 already has results. Aborting to avoid data loss.");
      process.exit(1);
    }

    // Delete existing matches
    console.log("🗑️  Deleting existing round 1 matches...");
    const { error: delError } = await supabase
      .from("matches")
      .delete()
      .eq("round_id", roundId);

    if (delError) {
      console.error("❌ Failed to delete existing matches:", delError.message);
      process.exit(1);
    }
    console.log("   Deleted.");
  } else {
    // Create round 1
    console.log("   No round 1 found, creating...");
    const { data: newRound, error: createError } = await supabase
      .from("tournament_rounds")
      .insert({
        tournament_id: TOURNAMENT_ID,
        round_number: 1,
        status: "ongoing",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Failed to create round:", createError.message);
      process.exit(1);
    }
    roundId = newRound.id;
    console.log(`   Created round 1 (${roundId})`);
  }

  // ─── Insert matches ───────────────────────────────────────────────────────

  console.log("\n💾 Inserting matches...");
  const matchesToInsert = validPairings.map(([whiteId, blackId], index) => ({
    round_id: roundId,
    player1_id: whiteId,
    player2_id: blackId,
    table_no: index + 1,
    status: "pending",
    player1_score: null,
    player2_score: null,
  }));

  const { data: created, error: insertError } = await supabase
    .from("matches")
    .insert(matchesToInsert)
    .select("table_no, player1_id, player2_id");

  if (insertError) {
    console.error("❌ Failed to insert matches:", insertError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${created.length} matches`);

  // ─── Verify ────────────────────────────────────────────────────────────────

  // Fetch names for verification
  const allPlayerIds = created.flatMap((m) => [m.player1_id, m.player2_id]);
  const { data: playerNames } = await supabase
    .from("registrations")
    .select("id, full_name")
    .in("id", allPlayerIds);

  const nameMap = new Map(playerNames?.map((p) => [p.id, p.full_name]) ?? []);

  console.log("\n📋 Final pairings:");
  for (const m of created.sort((a, b) => a.table_no - b.table_no)) {
    const white = nameMap.get(m.player1_id) ?? m.player1_id.slice(0, 8);
    const black = nameMap.get(m.player2_id) ?? m.player2_id.slice(0, 8);
    console.log(`   Meja ${String(m.table_no).padStart(2)}: ${white.padEnd(25)} vs ${black}`);
  }

  console.log(`\n🎉 Done! ${created.length} pairings synced to round 1.`);
  console.log(`   View at: https://smd-chess.vercel.app/admin/ronde/${TOURNAMENT_ID}`);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
