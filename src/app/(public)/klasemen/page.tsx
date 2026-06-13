import { TournamentIndex } from "@/components/ui/tournament-index";

export default function KlasemenIndexPage() {
  return (
    <TournamentIndex
      title="Klasemen"
      description="Pilih turnamen untuk melihat klasemen"
      linkPrefix="/klasemen"
      statusFilter={["ongoing", "finished"]}
      emptyMessage="Belum ada turnamen dengan klasemen."
    />
  );
}
