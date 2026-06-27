"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { validatePairings } from "@/lib/swiss/validation";
import type { Pairing, Player, Violation } from "@/lib/swiss/types";
interface PairingEditorProps {
  roundId: string;
  roundNumber: number;
  matches: Array<{
    id: string;
    player1_id: string;
    player2_id: string | null;
    table_no: number | null;
    player1_score: number | null;
    player2_score: number | null;
    white_name: string;
    black_name: string | null;
  }>;
  players: Array<{
    id: string;
    full_name: string;
    score: number;
    opponentIds: string[];
    lastColor: "W" | "B" | null;
    hadBye: boolean;
    chess_rating: number;
  }>;
}
type LocalMatch = {
  table_no: number | null;
  player1_id: string;
  player2_id: string | null;
};
type PlayerSlot = {
  matchIndex: number;
  key: "player1_id" | "player2_id";
};
function toLocalMatch(match: PairingEditorProps["matches"][number]): LocalMatch {
  return {
    table_no: match.table_no,
    player1_id: match.player1_id,
    player2_id: match.player2_id,
  };
}
function compareMatches(a: LocalMatch, b: LocalMatch) {
  if (a.table_no === null && b.table_no === null) return 0;
  if (a.table_no === null) return 1;
  if (b.table_no === null) return -1;
  return a.table_no - b.table_no;
}
export function PairingEditor({ roundId, roundNumber, matches, players }: PairingEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [localMatches, setLocalMatches] = useState<LocalMatch[]>(() => matches.map(toLocalMatch));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerMap = useMemo(() => new Map(players.map((player) => [player.id, player] as const)), [players]);
  const orderedMatches = useMemo(() => [...localMatches].sort(compareMatches), [localMatches]);
  const pairings: Pairing[] = useMemo(
    () =>
      localMatches.map((match) => {
        const white = playerMap.get(match.player1_id)!;
        const black = match.player2_id ? playerMap.get(match.player2_id)! : null;
        return { white, black: black ?? null, tableNo: match.table_no };
      }),
    [localMatches, playerMap],
  );
  const validation = useMemo(
    () =>
      validatePairings(pairings, {
        firstRound: roundNumber === 1,
        expectedPlayerIds: players.map((player) => player.id),
      }),
    [pairings, players, roundNumber],
  );
  const warningsByTable = useMemo(() => {
    const map = new Map<number, Violation[]>();
    const byeWarnings: Violation[] = [];
    for (const warning of validation.warnings) {
      if (warning.tableNo === null) {
        byeWarnings.push(warning);
        continue;
      }
      const current = map.get(warning.tableNo) ?? [];
      current.push(warning);
      map.set(warning.tableNo, current);
    }
    return { map, byeWarnings };
  }, [validation.warnings]);
  function resetEditor() {
    setLocalMatches(matches.map(toLocalMatch));
    setSelectedPlayerId(null);
    setError(null);
    setEditing(false);
  }
  function findSlot(matchList: LocalMatch[], playerId: string): PlayerSlot | null {
    for (let index = 0; index < matchList.length; index += 1) {
      const match = matchList[index];
      if (match.player1_id === playerId) return { matchIndex: index, key: "player1_id" };
      if (match.player2_id === playerId) return { matchIndex: index, key: "player2_id" };
    }
    return null;
  }
  function swapPlayers(playerAId: string, playerBId: string) {
    if (playerAId === playerBId) return;
    setLocalMatches((current) => {
      const next = current.map((match) => ({ ...match }));
      const slotA = findSlot(next, playerAId);
      const slotB = findSlot(next, playerBId);
      if (!slotA || !slotB) return current;
      next[slotA.matchIndex][slotA.key] = playerBId;
      next[slotB.matchIndex][slotB.key] = playerAId;
      return next;
    });
  }
  function handlePlayerClick(playerId: string) {
    if (!editing) return;
    if (!selectedPlayerId) {
      setSelectedPlayerId(playerId);
      return;
    }
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
      return;
    }
    swapPlayers(selectedPlayerId, playerId);
    setSelectedPlayerId(null);
  }
  function moveTable(tableNo: number, direction: -1 | 1) {
    setLocalMatches((current) => {
      const next = current.map((entry) => ({ ...entry }));
      const currentIndex = next.findIndex((entry) => entry.table_no === tableNo);
      const targetTableNo = tableNo + direction;
      const targetIndex = next.findIndex((entry) => entry.table_no === targetTableNo);
      if (currentIndex === -1 || targetIndex === -1) return current;
      const currentTable = next[currentIndex].table_no;
      next[currentIndex].table_no = next[targetIndex].table_no;
      next[targetIndex].table_no = currentTable;
      return next;
    });
  }
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rounds/${roundId}/pairings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matches: localMatches.map((match) => ({
            table_no: match.table_no,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
          })),
        }),
      });
      if (!res.ok) {
        let message = "Gagal menyimpan pairing";
        try {
          const json = await res.json();
          message = json.error || message;
        } catch {
          // ignore parse errors
        }
        setError(message);
        return;
      }
      setEditing(false);
      setSelectedPlayerId(null);
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  }
  function renderPlayerChip(player: Player, className = "") {
    const selected = selectedPlayerId === player.id;
    return (
      <button
        type="button"
        onClick={() => handlePlayerClick(player.id)}
        className={`rounded-full border border-gray-300 dark:border-gray-500 px-2.5 py-1 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${selected ? "ring-2 ring-blue-400" : ""} ${className}`}
      >
        {player.full_name}
      </button>
    );
  }
  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pairing Ronde {roundNumber}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Atur ulang pasangan, warna, dan bye sebelum disimpan.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Atur Pairing
        </button>
      </div>
    );
  }
  const byeIndex = orderedMatches.findIndex((match) => match.table_no === null || match.player2_id === null);
  const byeMatch = byeIndex >= 0 ? orderedMatches[byeIndex] : null;
  const byePlayer = byeMatch ? playerMap.get(byeMatch.player1_id) ?? null : null;
  const hasBye = Boolean(byeMatch && byePlayer);
  const playerCountOdd = players.length % 2 === 1;
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Pairing Ronde {roundNumber}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Klik pemain untuk pilih, lalu klik pemain lain untuk tukar posisi.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetEditor}
            className="rounded-lg bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !validation.ok}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {playerCountOdd && hasBye && byePlayer && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Slot BYE:</span>
            {renderPlayerChip(byePlayer)}
            <span className="rounded bg-gray-200 dark:bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200">BYE</span>
          </div>
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200">
            <span>Pilih pemain untuk BYE</span>
            <select
              value={byePlayer.id}
              onChange={(event) => {
                const nextPlayerId = event.target.value;
                if (nextPlayerId && nextPlayerId !== byePlayer.id) {
                  swapPlayers(byePlayer.id, nextPlayerId);
                }
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.full_name}
                </option>
              ))}
            </select>
          </label>
          {warningsByTable.byeWarnings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {warningsByTable.byeWarnings.map((warning, index) => (
                <span key={`${warning.code}-${index}`} className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded">
                  {warning.message}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="space-y-3">
        {orderedMatches
          .filter((match): match is LocalMatch & { table_no: number } => match.table_no !== null)
          .map((match) => {
            const tableNo = match.table_no;
            const white = playerMap.get(match.player1_id)!;
            const black = match.player2_id ? playerMap.get(match.player2_id)! : null;
            const rowWarnings = warningsByTable.map.get(tableNo) ?? [];
            return (
              <div key={`${tableNo}-${match.player1_id}-${match.player2_id ?? "bye"}`} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <span>Meja {tableNo}</span>
                    {rowWarnings.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rowWarnings.map((warning, index) => (
                          <span key={`${warning.code}-${index}`} className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded">
                            {warning.message}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveTable(tableNo, -1)}
                      disabled={tableNo === 1}
                      className="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTable(tableNo, 1)}
                      disabled={orderedMatches.filter((entry) => entry.table_no !== null).every((entry) => entry.table_no !== tableNo + 1)}
                      className="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalMatches((current) => {
                          const next = current.map((entry) => ({ ...entry }));
                          const index = next.findIndex((entry) => entry.table_no === tableNo);
                          if (index === -1) return current;
                          const whiteId = next[index].player1_id;
                          next[index].player1_id = next[index].player2_id ?? whiteId;
                          next[index].player2_id = whiteId;
                          return next;
                        });
                      }}
                      className="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      ↔
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {renderPlayerChip(white)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">vs</span>
                  {black ? (
                    renderPlayerChip(black)
                  ) : (
                    <span className="rounded-full border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600 px-2.5 py-1 text-sm font-medium text-gray-600 dark:text-gray-300">BYE</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((violation, index) => (
            <p key={`${violation.code}-${index}`} className="text-red-600 text-sm">
              {violation.message}
            </p>
          ))}
        </div>
      )}
      {!validation.ok && <p className="text-sm text-red-600">Pairing masih memiliki error.</p>}
    </div>
  );
}
