import { TournamentIndex } from "@/components/ui/tournament-index";

export default function JadwalIndexPage() {
  return (
    <TournamentIndex
      title="Jadwal Pertandingan"
      description="Pilih turnamen untuk melihat jadwal pairing"
      linkPrefix="/jadwal"
      statusFilter={["ongoing", "open", "finished"]}
      emptyMessage="Belum ada turnamen dengan jadwal pertandingan."
    />
  );
}
