"use client";

import { useState } from "react";

interface Props {
  url: string;
  name: string;
}

export function ProofViewer({ url, name }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 hover:underline text-xs"
      >
        Lihat
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-medium truncate">{name}</p>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <img
              src={url}
              alt={`Bukti transfer ${name}`}
              className="w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
