import { Landmark } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-10">
      {/* Background decorative tint */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#F8FAFC] blur-3xl" />
      <div className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#F8FAFC] blur-3xl" />

      {/* Login container */}
      <section className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] text-[#F59E0B] shadow-xl border border-[#F59E0B]/20">
            <Landmark size={30} strokeWidth={2.2} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
            Accounts
          </h1>

          <p className="mt-2 text-xs leading-6 text-[#64748B]">
            Professional Multi-Company Accounting Workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-[#0F172A]">
              Welcome back
            </h2>

            <p className="mt-1.5 text-xs text-[#64748B]">
              Sign in to access your company workspaces and financial ledgers.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[#64748B]">
          © {new Date().getFullYear()} The 5th Dimension Corporate Consultancy. All rights reserved.
        </p>
      </section>
    </main>
  );
}
