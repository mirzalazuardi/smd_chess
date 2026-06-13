"use client";

import { useState } from "react";

interface Props {
  registrationId: string;
  adminId: string;
  initialPaid: boolean;
}

export function VerifyButton({ registrationId, adminId, initialPaid }: Props) {
  const [paid, setPaid] = useState(initialPaid);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !paid, admin_id: adminId }),
      });

      if (res.ok) {
        setPaid(!paid);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        paid
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      }`}
    >
      {loading ? "..." : paid ? "Lunas" : "Belum Lunas"}
    </button>
  );
}
