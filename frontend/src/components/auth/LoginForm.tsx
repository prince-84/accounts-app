"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Temporary frontend-only login logic.
    // This will later be replaced with Laravel authentication.
    router.push("/companies");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold text-slate-700"
        >
          Email address
        </label>

        <div className="relative">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12 rounded-xl border-slate-200 bg-white pl-11 shadow-sm transition focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <button
            type="button"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>

        <div className="relative">
          <LockKeyhole
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-12 shadow-sm transition focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) =>
            setRememberMe(checked === true)
          }
        />

        <label
          htmlFor="remember"
          className="cursor-pointer text-sm text-slate-600"
        >
          Remember me
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30"
      >
        Sign in to Accounts
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}