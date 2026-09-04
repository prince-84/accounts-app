import { Landmark } from "lucide-react";

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FB] px-4 py-10">
      {/* Background decorative blobs */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/10 blur-3xl" />

      {/* Login container */}
      <section className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
            <Landmark size={30} strokeWidth={2.2} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Accounts
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            A smarter way to manage your business finances.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/80 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to access your accounting workspace.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Accounts. All rights reserved.
        </p>
      </section>
    </main>
  );
}
