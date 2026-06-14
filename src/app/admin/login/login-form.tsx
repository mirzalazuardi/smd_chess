"use client";

import { useFormState } from "react-dom";
import { loginAction } from "./actions";
import { useSearchParams } from "next/navigation";

const initialState = { error: null as string | null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect} />

      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="admin@percasisumedang.id"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        Masuk
      </button>
    </form>
  );
}
