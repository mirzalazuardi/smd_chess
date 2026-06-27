"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export function AutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [countdown, setCountdown] = useState(intervalSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          routerRef.current.refresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalSeconds]);

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
