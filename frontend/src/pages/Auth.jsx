import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/FormControls";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organisation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg-base)]">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      {/* Amber glow blob */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none -top-[200px] -right-[200px]"
        style={{
          background:
            "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="bg-[var(--bg-surface)] border border-[var(--border-bright)] rounded-[var(--radius-lg)] p-10 w-full max-w-[420px] relative z-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] animate-[fadeUp_0.35s_ease_forwards]">
        {/* Brand */}
        <div className="flex items-center gap-[10px] mb-[6px]">
          <span className="text-[1.4rem] text-[var(--accent)]">▶</span>
          <span className="font-[var(--font-display)] text-[1.1rem] font-extrabold tracking-[0.14em]">
            VAULTCAST
          </span>
        </div>

        {/* Tagline */}
        <p className="text-[0.78rem] text-[var(--text-muted)] mb-[28px] tracking-[0.02em]">
          {mode === "login"
            ? "Sign in to your workspace"
            : "Create a new workspace"}
        </p>

        {/* Form */}
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {mode === "register" && (
            <>
              <Input
                label="Full name"
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Your name"
                required
                autoFocus
              />
              <Input
                label="Organisation"
                type="text"
                value={form.organisation}
                onChange={set("organisation")}
                placeholder="company-name (optional)"
              />
            </>
          )}

          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            required
            autoFocus={mode === "login"}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
            required
          />

          {error && (
            <p className="text-[0.78rem] text-[var(--danger)] bg-[var(--danger-glow)] border border-[var(--danger-dim)] p-[8px_12px] rounded-[var(--radius-sm)]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full justify-center mt-1"
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        {/* Switch Mode */}
        <p className="mt-5 text-center text-[0.78rem] text-[var(--text-muted)]">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            className="bg-transparent border-none text-[var(--text-[var(--accent)])] font-[var(--font-mono)] text-[0.78rem] cursor-pointer hover:underline hover:text-[var(--accent)] transition-all"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
