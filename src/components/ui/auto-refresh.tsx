"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function AutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(intervalSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.refresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router, intervalSeconds]);

  function handleRefresh() {
    router.refresh();
    setCountdown(intervalSeconds);
  }

  return (
    <button
      onClick={handleRefresh}
      className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
    >
      Refresh ({countdown}s)
    </button>
  );
}
