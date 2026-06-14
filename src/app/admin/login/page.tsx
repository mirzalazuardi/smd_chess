import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
          <p className="text-sm text-gray-500">
            Masuk untuk mengelola turnamen
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
