"use client";

import { useState, useMemo } from "react";
import type { StandingsEntry } from "@/lib/swiss/types";

type SortKey = keyof Pick<
  StandingsEntry,
  "rank" | "fullName" | "score" | "wins" | "draws" | "losses" | "buchholz"
>;
type SortDir = "asc" | "desc";

interface Column {
  key: SortKey;
  label: string;
  align: "left" | "center";
  hideOnMobile?: boolean;
  // Default direction applied when a column is first clicked.
  defaultDir: SortDir;
}

const COLUMNS: Column[] = [
  { key: "rank", label: "#", align: "center", defaultDir: "asc" },
  { key: "fullName", label: "Nama", align: "left", defaultDir: "asc" },
  { key: "score", label: "Poin", align: "center", defaultDir: "desc" },
  { key: "wins", label: "M", align: "center", hideOnMobile: true, defaultDir: "desc" },
  { key: "draws", label: "S", align: "center", hideOnMobile: true, defaultDir: "desc" },
  { key: "losses", label: "K", align: "center", hideOnMobile: true, defaultDir: "desc" },
  { key: "buchholz", label: "BH", align: "center", hideOnMobile: true, defaultDir: "desc" },
];

function compare(a: StandingsEntry, b: StandingsEntry, key: SortKey): number {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "string" && typeof bv === "string") {
    return av.localeCompare(bv, "id");
  }
  return (av as number) - (bv as number);
}

export function StandingsTable({ standings }: { standings: StandingsEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const rows = [...standings].sort((a, b) => compare(a, b, sortKey));
    if (sortDir === "desc") rows.reverse();
    return rows;
  }, [standings, sortKey, sortDir]);

  function handleSort(column: Column) {
    if (column.key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column.key);
      setSortDir(column.defaultDir);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {COLUMNS.map((column) => {
              const active = column.key === sortKey;
              return (
                <th
                  key={column.key}
                  aria-sort={
                    active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                  }
                  className={`px-2 sm:px-3 py-3 font-medium text-gray-600 ${
                    column.align === "left" ? "text-left" : "text-center"
                  } ${column.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className={`inline-flex items-center gap-1 hover:text-blue-600 ${
                      column.align === "left" ? "" : "justify-center"
                    } ${active ? "text-blue-600 font-semibold" : ""}`}
                  >
                    {column.label}
                    <span className="text-[0.65em]">
                      {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((entry) => (
            <tr
              key={entry.playerId}
              className={
                entry.rank <= 3
                  ? "bg-yellow-50 dark:bg-yellow-900/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }
            >
              <td className="text-center px-2 sm:px-3 py-3 font-bold">{entry.rank}</td>
              <td className="px-2 sm:px-3 py-3 font-medium truncate max-w-[200px]">
                {entry.fullName}
              </td>
              <td className="text-center px-2 sm:px-3 py-3 font-mono font-bold">
                {entry.score}
              </td>
              <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                {entry.wins}
              </td>
              <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                {entry.draws}
              </td>
              <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                {entry.losses}
              </td>
              <td className="text-center px-2 sm:px-3 py-3 font-mono text-gray-500 hidden sm:table-cell">
                {entry.buchholz}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
