#!/usr/bin/env node
/**
 * sync-sd-pairings.mjs
 *
 * Syncs round 1 pairings from chess-results.com (SD tournament) into SMD Chess.
 * Reference: https://s3.chess-results.com/tnr1446778.aspx?lan=26&art=2&rd=1&SNode=S0
 * Target: 85d0016d-c55d-4cd9-b2ed-7ae05233917a
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ykbuemlpflvdpzamksww.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnVlbWxwZmx2ZHB6YW1rc3d3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyODIxNSwiZXhwIjoyMDk2OTA0MjE1fQ.ah90LujSeAme4Pg1GSPHVO-FsX95LfB8W9_eXx2CzXw";

const TOURNAMENT_ID = "85d0016d-c55d-4cd9-b2ed-7ae05233917a";
const ADMIN_ID = "17c89644-2fd2-4452-b875-f5da7b15a69f";

// Chess-results.com starting rank list (No → Name)
const CR_PLAYERS = {
  1: "ABIZAR FAIZ MUADZI",
  2: "AL KHOLIF",
  3: "ALIF",
  4: "ARKA ZULFAN HAMIZAN",
  5: "ASEP GUNAWAN",
  6: "DANISH SATRIO AL FATIH",
  7: "FATIH HAMIZAN AL KHALIFI",
  8: "GALAN ARSA",
  9: "GIBRAN SYAFIQ PUTRA YUSUF",
  10: "GUNTUR PAMUNGKAS",
  11: "HENDI SOPIAN",
  12: "JAKA JAGATNITI AL FAREZI SONJAYA",
  13: "JASIR AFKAR YUDHAWIREDJA. BASUDE",
  14: "KAYLA RIZKI NUR FITRIA",
  15: "KEN ARKAAN LAZUARDI",
  16: "M.H. AL FAQIH",
  17: "MUHAMMAD ALFARISI ADI K",
  18: "MUHAMMAD ARKAN ALQORNI",
  19: "MUHAMMAD DZIKRI ZAIDAN.BASUDEWA",
  20: "MUHAMMAD FAQIH ANNURUDDIN",
  21: "MUHAMMAD FARDAN RAMADANSYAH",
  22: "MUHAMMAD FATHAN FEBRIAN NURSYAMS",
  23: "MUHAMMAD RAFFASYA ARKANTA",
  24: "MUHAMMAD RAYYAN GHAZI AL GHIFARI",
  25: "MUSA DAUD. BASUDEWA",
  26: "NABHAN AQILA MIRZA AL GHIFARI",
  27: "NARA ZALFAN HAMIZAN",
  28: "NAZRIL MUAZZAM HADIPUTRA",
  29: "NIZAR AFSAL YUDHAWIREDJA. BASUDE",
  30: "PUTRA RAMADHAN",
  31: "RAFFANDRA AQLAN LAZUARDI",
  32: "RAIN ARIZKY PRANAJA ARMI",
  33: "RIDHO MIRZA ABDURAHMAN",
  34: "THEO ALFATHAN SAFAL ABKHORY",
  35: "UWAIS AKBAR AL KANJANIY",
};

// Exact name overrides: chess-results name → expected DB full_name
// (for names where fuzzy matching gets it wrong)
const NAME_OVERRIDES = {
  "M.H. AL FAQIH": "M. H. Al Faqih",
  "MUHAMMAD RAFFASYA ARKANTA": "Muhammad Raffasya Arkananta",
  "NARA ZALFAN HAMIZAN": "Nara Zulfan Hamizan",
  "RIDHO MIRZA ABDURAHMAN": "Ridho Mirza Abdurrahman",
  "UWAIS AKBAR AL KANJANIY": "Uwais Akbar Al Kanzaniy",
  "FATIH HAMIZAN AL KHALIFI": null, // will be added
  "ASEP GUNAWAN": null,
  "JASIR AFKAR YUDHAWIREDJA. BASUDE": null,
  "KAYLA RIZKI NUR FITRIA": null,
  "MUHAMMAD DZIKRI ZAIDAN.BASUDEWA": null,
  "MUSA DAUD. BASUDEWA": null,
  "NIZAR AFSAL YUDHAWIREDJA. BASUDE": null,
};

// Chess-results.com Round 1 pairings [whiteNo, blackNo]
const CR_PAIRINGS = [
  [18, 1], [2, 19], [20, 3], [4, 21], [22, 5], [6, 23],
  [24, 7], [8, 25], [26, 9], [10, 27], [28, 11], [12, 29],
  [30, 13], [14, 31], [32, 15], [16, 33], [34, 17],
  // Board 18: player 35 vs BYE (no black opponent)
];

function norm(s) {
  return s.toLowerCase().replace(/[,.]/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ─── 1. Fetch registrations ──────────────────────────────────────────────
  console.log("🔍 Fetching registrations...");
  const { data: allRegs } = await supabase
    .from("registrations")
    .select("id, full_name, registration_id, paid, is_active")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("paid", true);

  const activeRegs = allRegs.filter((r) => r.is_active);
  console.log(`   Total paid: ${allRegs.length} | Active: ${activeRegs.length}\n`);

  // ─── 2. Identify players to DEACTIVATE (in DB but not in chess-results) ──
  const crNamesNorm = new Set(
    Object.values(CR_PLAYERS).map((n) => norm(n)),
  );

  const toDeactivate = [];
  const keepActive = [];

  for (const reg of activeRegs) {
    const n = norm(reg.full_name);
    // Check if this DB name maps to any CR name (exact or via override)
    const isInCr = [...Object.entries(NAME_OVERRIDES)].some(
      ([crName, dbName]) => dbName && norm(dbName) === n,
    ) || crNamesNorm.has(n) ||
    // Also check fuzzy: any CR name that might match this DB name
    [...Object.entries(CR_PLAYERS)].some(([no, crName]) => {
      if (NAME_OVERRIDES[crName] !== undefined) return false; // handled above
      const crN = norm(crName);
      const crW = crN.split(" ").filter(Boolean);
      const regW = n.split(" ").filter(Boolean);
      const shorter = crW.length <= regW.length ? crW : regW;
      const longer = crW.length <= regW.length ? regW : crW;
      const matchCount = shorter.filter((w) =>
        longer.some((lw) => lw.includes(w) || w.includes(lw)),
      ).length;
      return matchCount >= shorter.length * 0.8;
    });

    if (isInCr) {
      keepActive.push(reg);
    } else {
      toDeactivate.push(reg);
    }
  }

  // ─── 3. Identify players to ADD (in chess-results but not in DB) ─────────
  const dbNamesNorm = new Set(activeRegs.map((r) => norm(r.full_name)));
  const toAdd = [];

  for (const [noStr, crName] of Object.entries(CR_PLAYERS)) {
    const crN = norm(crName);
    const override = NAME_OVERRIDES[crName];

    if (override === null) {
      // Explicitly marked as "not in DB"
      toAdd.push({ no: parseInt(noStr), crName });
      continue;
    }

    if (override) {
      const found = activeRegs.find((r) => norm(r.full_name) === norm(override));
      if (!found) toAdd.push({ no: parseInt(noStr), crName });
      continue;
    }

    // Check if exists in DB
    const crW = crN.split(" ").filter(Boolean);
    const found = activeRegs.find((r) => {
      const regN = norm(r.full_name);
      const regW = regN.split(" ").filter(Boolean);
      const shorter = crW.length <= regW.length ? crW : regW;
      const longer = crW.length <= regW.length ? regW : crW;
      const matchCount = shorter.filter((w) =>
        longer.some((lw) => lw.includes(w) || w.includes(lw)),
      ).length;
      return matchCount >= shorter.length * 0.8;
    });

    if (!found) {
      toAdd.push({ no: parseInt(noStr), crName });
    }
  }

  // ─── 4. Execute ADD ──────────────────────────────────────────────────────
  if (toAdd.length > 0) {
    console.log(`➕ Adding ${toAdd.length} missing players...`);
    // Get last registration_id
    const { data: lastReg } = await supabase
      .from("registrations")
      .select("registration_id")
      .eq("tournament_id", TOURNAMENT_ID)
      .order("registration_id", { ascending: false })
      .limit(1);

    let lastSeq = 0;
    const match = lastReg?.[0]?.registration_id?.match(/CATUR2026-(\d+)/);
    if (match) lastSeq = parseInt(match[1]);

    for (const p of toAdd) {
      lastSeq++;
      const { data: inserted, error } = await supabase
        .from("registrations")
        .insert({
          tournament_id: TOURNAMENT_ID,
          registration_id: `CATUR2026-${lastSeq}`,
          full_name: p.crName.replace(/[,.]/g, "").replace(/\s+/g, " ").trim(),
          student_status: "umum",
          paid: true,
          is_active: true,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: ADMIN_ID,
        })
        .select("id, full_name, registration_id");

      if (error) {
        console.error(`   ❌ Failed to add ${p.crName}: ${error.message}`);
      } else {
        console.log(`   ✅ #${p.no} ${p.crName} → ${inserted[0].registration_id}`);
      }
    }
  }

  // ─── 5. Execute DEACTIVATE ───────────────────────────────────────────────
  if (toDeactivate.length > 0) {
    console.log(`\n🔒 Deactivating ${toDeactivate.length} extra players...`);
    const ids = toDeactivate.map((r) => r.id);
    const { error } = await supabase
      .from("registrations")
      .update({ is_active: false })
      .in("id", ids);

    if (error) {
      console.error(`   ❌ Deactivate failed: ${error.message}`);
    } else {
      for (const r of toDeactivate) {
        console.log(`   🔒 ${r.full_name}`);
      }
    }
  }

  // ─── 6. Refetch active registrations ─────────────────────────────────────
  const { data: finalRegs } = await supabase
    .from("registrations")
    .select("id, full_name")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("paid", true)
    .eq("is_active", true)
    .order("full_name");

  console.log(`\n📊 Final active: ${finalRegs.length} players`);

  // ─── 7. Build mapping: CR No → DB ID ─────────────────────────────────────
  const crNoToDbId = new Map();
  const usedIds = new Set();
  const unmatched = [];

  for (const [noStr, crName] of Object.entries(CR_PLAYERS)) {
    const no = parseInt(noStr);
    const override = NAME_OVERRIDES[crName];

    let match = null;

    if (override) {
      match = finalRegs.find((r) => norm(r.full_name) === norm(override));
    }

    if (!match) {
      // Try exact match first
      match = finalRegs.find(
        (r) => norm(r.full_name) === norm(crName) && !usedIds.has(r.id),
      );
    }

    if (!match) {
      // Fuzzy match (conservative — require real word overlap)
      const crN = norm(crName);
      const crW = crN.split(" ").filter(Boolean);
      for (const reg of finalRegs) {
        if (usedIds.has(reg.id)) continue;
        const regN = norm(reg.full_name);
        const regW = regN.split(" ").filter(Boolean);
        const shorter = crW.length <= regW.length ? crW : regW;
        const longer = crW.length <= regW.length ? regW : crW;
        // Require all shorter words to have a match in longer
        const allMatch = shorter.every((w) =>
          longer.some((lw) => lw.includes(w) || w.includes(lw)),
        );
        // AND shorter must be >50% of longer (avoid "al" matching "rosalinda")
        const ratioOk = shorter.length >= longer.length * 0.5;
        if (allMatch && ratioOk) {
          match = reg;
          break;
        }
      }
    }

    if (match) {
      crNoToDbId.set(no, match.id);
      usedIds.add(match.id);
    } else {
      unmatched.push({ no, crName });
    }
  }

  const extra = finalRegs.filter((r) => !usedIds.has(r.id));

  console.log(`   Mapped: ${crNoToDbId.size}/${Object.keys(CR_PLAYERS).length}`);
  if (unmatched.length > 0) {
    console.log(`   ⚠️  Unmatched: ${unmatched.map((u) => `#${u.no} "${u.crName}"`).join(", ")}`);
  }
  if (extra.length > 0) {
    console.log(`   📋 Extra: ${extra.map((e) => e.full_name).join(", ")}`);
  }

  // ─── 8. Build pairings ───────────────────────────────────────────────────
  const finalPairings = [];
  let byePlayerId = null;

  for (const [whiteNo, blackNo] of CR_PAIRINGS) {
    const whiteId = crNoToDbId.get(whiteNo);
    const blackId = crNoToDbId.get(blackNo);

    if (whiteId && blackId) {
      finalPairings.push([whiteId, blackId]);
    } else if (!whiteId && !blackId) {
      continue; // both missing — skip
    } else if (whiteId && !blackId) {
      byePlayerId = whiteId;
    } else {
      byePlayerId = blackId;
    }
  }

  // Player 35 gets BYE (chess-results board 18: 35 vs bye)
  if (!byePlayerId) {
    byePlayerId = crNoToDbId.get(35);
  }

  // Handle any remaining unpaired
  const paired = new Set(finalPairings.flat());
  if (byePlayerId) paired.add(byePlayerId);
  const unpaired = finalRegs.filter((r) => !paired.has(r.id));

  if (unpaired.length > 0) {
    console.log(`\n⚠️  ${unpaired.length} unpaired players, giving BYEs...`);
    // Shouldn't happen — chess-results has exactly 35 players
  }

  console.log(`\n📋 Final: ${finalPairings.length} boards + ${byePlayerId ? 1 : 0} BYE`);

  // ─── 9. Get round 1 ──────────────────────────────────────────────────────
  console.log("\n🔍 Checking round 1...");
  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("id, round_number, status")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("round_number", 1);

  let roundId;

  if (rounds && rounds.length > 0) {
    roundId = rounds[0].id;
    // Delete existing matches
    const { error: delErr } = await supabase
      .from("matches")
      .delete()
      .eq("round_id", roundId);

    if (delErr) {
      console.error(`❌ Delete failed: ${delErr.message}`);
      process.exit(1);
    }
    console.log(`   Deleted existing matches from round ${roundId}`);
  } else {
    const { data: newRound, error: createErr } = await supabase
      .from("tournament_rounds")
      .insert({
        tournament_id: TOURNAMENT_ID,
        round_number: 1,
        status: "ongoing",
      })
      .select()
      .single();

    if (createErr) {
      console.error(`❌ Create round failed: ${createErr.message}`);
      process.exit(1);
    }
    roundId = newRound.id;
    console.log(`   Created round 1 (${roundId})`);
  }

  // ─── 10. Insert matches ──────────────────────────────────────────────────
  const matchesToInsert = [];

  for (let i = 0; i < finalPairings.length; i++) {
    const [whiteId, blackId] = finalPairings[i];
    matchesToInsert.push({
      round_id: roundId,
      player1_id: whiteId,
      player2_id: blackId,
      table_no: i + 1,
      status: "pending",
      player1_score: null,
      player2_score: null,
    });
  }

  // BYE match (table_no = null, no black, auto-completed)
  if (byePlayerId) {
    matchesToInsert.push({
      round_id: roundId,
      player1_id: byePlayerId,
      player2_id: null,
      table_no: null,
      status: "completed",
      player1_score: 1,
      player2_score: null,
    });
  }

  console.log(`💾 Inserting ${matchesToInsert.length} matches...`);
  const { data: created, error: insErr } = await supabase
    .from("matches")
    .insert(matchesToInsert)
    .select("table_no, player1_id, player2_id, status");

  if (insErr) {
    console.error(`❌ Insert failed: ${insErr.message}`);
    process.exit(1);
  }

  // ─── 11. Display final pairings ───────────────────────────────────────────
  const allIds = created.flatMap((m) => [m.player1_id, m.player2_id].filter(Boolean));
  const { data: names } = await supabase
    .from("registrations")
    .select("id, full_name")
    .in("id", allIds);
  const nameMap = new Map(names.map((n) => [n.id, n.full_name]));

  console.log("\n📋 Final pairings:");
  for (const m of created.sort((a, b) => (a.table_no ?? 999) - (b.table_no ?? 999))) {
    const white = nameMap.get(m.player1_id) ?? "?";
    const black = m.player2_id ? nameMap.get(m.player2_id) ?? "?" : "BYE";
    const tn = m.table_no !== null ? `Meja ${String(m.table_no).padStart(2)}` : "BYE  ";
    const status = m.status === "completed" ? " [auto]" : "";
    console.log(`   ${tn}: ${white.padEnd(40)} vs ${black}${status}`);
  }

  console.log(`\n🎉 Done! ${created.length} matches synced.`);
  console.log(`🔗 https://smd-chess.vercel.app/admin/ronde/${TOURNAMENT_ID}`);
}

main().catch((err) => {
  console.error("❌ Unexpected:", err);
  process.exit(1);
});
