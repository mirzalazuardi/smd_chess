const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Buka",
  ongoing: "Berlangsung",
  finished: "Selesai",
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-green-100 text-green-700",
  ongoing: "bg-blue-100 text-blue-700",
  finished: "bg-yellow-100 text-yellow-700",
};

interface Props {
  title: string;
  description: string;
  linkPrefix: string;
  statusFilter: string[];
  emptyMessage: string;
}

export async function TournamentIndex({
  title,
  description,
  linkPrefix,
  statusFilter,
  emptyMessage,
}: Props) {
  return <main>TODO</main>;
}
