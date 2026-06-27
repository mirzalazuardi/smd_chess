import type {
  Pairing,
  PairingValidationResult,
  Violation,
} from "./types";

function buildResult(violations: Violation[]): PairingValidationResult {
  const errors = violations.filter((violation) => violation.severity === "error");
  const warnings = violations.filter((violation) => violation.severity === "warning");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function validatePairings(
  pairings: Pairing[],
  options: {
    firstRound: boolean;
    expectedPlayerIds: string[];
    scoreGapThreshold?: number;
  },
): PairingValidationResult {
  const actualPlayerIds = pairings.flatMap((pairing) =>
    pairing.black ? [pairing.white.id, pairing.black.id] : [pairing.white.id],
  );

  const expectedPlayerIds = options.expectedPlayerIds;
  const actualSorted = [...actualPlayerIds].sort();
  const expectedSorted = [...expectedPlayerIds].sort();

  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((id, index) => id !== expectedSorted[index])
  ) {
    return buildResult([
      {
        code: "invalid_permutation",
        severity: "error",
        message: "Permutasi tidak sah: kumpulan pemain tidak cocok",
        tableNo: null,
        playerIds: [],
      },
    ]);
  }

  if (options.firstRound) {
    return buildResult([]);
  }

  const violations: Violation[] = [];
  const scoreGapThreshold = options.scoreGapThreshold ?? 1;
  let byeAssigned = false;

  for (const pairing of pairings) {
    if (!pairing.black) {
      if (byeAssigned) {
        violations.push({
          code: "repeat_bye",
          severity: "error",
          message: "Hanya boleh ada satu bye per ronde",
          tableNo: null,
          playerIds: [pairing.white.id],
        });
      } else if (pairing.white.hadBye) {
        violations.push({
          code: "repeat_bye",
          severity: "error",
          message: `${pairing.white.full_name} sudah bye sebelumnya, tidak boleh bye lagi`,
          tableNo: null,
          playerIds: [pairing.white.id],
        });
      } else {
        byeAssigned = true;
      }
      continue;
    }

    if (pairing.white.opponentIds.includes(pairing.black.id)) {
      violations.push({
        code: "rematch",
        severity: "error",
        message: `Rematch: ${pairing.white.full_name} vs ${pairing.black.full_name} sudah bertemu di ronde sebelumnya`,
        tableNo: pairing.tableNo,
        playerIds: [pairing.white.id, pairing.black.id],
      });
    }

    if (pairing.white.lastColor === "W") {
      violations.push({
        code: "color_repeat",
        severity: "warning",
        message: `Putih dua kali berturut-turut untuk ${pairing.white.full_name}`,
        tableNo: pairing.tableNo,
        playerIds: [pairing.white.id],
      });
    }

    if (pairing.black.lastColor === "B") {
      violations.push({
        code: "color_repeat",
        severity: "warning",
        message: `Hitam dua kali berturut-turut untuk ${pairing.black.full_name}`,
        tableNo: pairing.tableNo,
        playerIds: [pairing.black.id],
      });
    }

    if (Math.abs(pairing.white.score - pairing.black.score) > scoreGapThreshold) {
      violations.push({
        code: "score_gap",
        severity: "warning",
        message: `Selisih skor terlalu jauh: ${pairing.white.full_name} (${pairing.white.score}) vs ${pairing.black.full_name} (${pairing.black.score})`,
        tableNo: pairing.tableNo,
        playerIds: [pairing.white.id, pairing.black.id],
      });
    }
  }

  return buildResult(violations);
}
