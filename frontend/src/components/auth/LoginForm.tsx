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
  const [email, setEmail] = useState("admin@accounts.com");
  const [password, setPassword] = useState("password123");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/companies");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-[#0F172A]"
        >
          Email address
        </label>

        <div className="relative">
          <Mail
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            size={17}
          />

          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] pl-10 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#F59E0B] focus-visible:ring-[#F59E0B]/20"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-[#0F172A]"
          >
            Password
          </label>

          <button
            type="button"
            className="text-xs font-medium text-[#F59E0B] transition hover:text-[#B48E35]"
          >
            Forgot password?
          </button>
        </div>

        <div className="relative">
          <LockKeyhole
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            size={17}
          />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-11 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#F59E0B] focus-visible:ring-[#F59E0B]/20"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] transition hover:text-[#0F172A]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) =>
            setRememberMe(checked === true)
          }
          className="border-[#E2E8F0] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
        />

        <label
          htmlFor="remember"
          className="cursor-pointer text-xs text-[#64748B]"
        >
          Remember me for 30 days
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-[#0F172A] text-xs font-semibold text-white shadow-lg transition hover:bg-[#0D1E3A] cursor-pointer"
      >
        <span>Sign in to Accounts</span>
        <ArrowRight size={16} className="text-[#F59E0B]" />
      </Button>
    </form>
  );
}