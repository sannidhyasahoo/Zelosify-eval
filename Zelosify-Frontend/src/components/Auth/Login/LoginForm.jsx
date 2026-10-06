import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Field } from "@/components/Auth/AuthCard";

export default function LoginForm({
  handleChange,
  handleSubmit,
  loginStage,
  isLoading,
  error,
  showPassword,
  setShowPassword,
  setLoginStage,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      {loginStage === "credentials" ? (
        <>
          <Field
            label="Username or email"
            htmlFor="usernameOrEmail"
            error={error.usernameOrEmail}
          >
            <input
              id="usernameOrEmail"
              name="usernameOrEmail"
              autoComplete="username"
              onChange={handleChange}
              required
              placeholder="you@company.com"
              aria-invalid={error.usernameOrEmail ? "true" : "false"}
              suppressHydrationWarning
              className="field"
            />
          </Field>

          <Field label="Password" htmlFor="password" error={error.password}>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                onChange={handleChange}
                required
                placeholder="Enter your password"
                aria-invalid={error.password ? "true" : "false"}
                suppressHydrationWarning
                className="field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                suppressHydrationWarning
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        </>
      ) : (
        <Field
          label="Authentication code"
          htmlFor="totp"
          error={error.totp}
          hint="Enter the 6-digit code from your authenticator app."
        >
          <input
            id="totp"
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            onChange={handleChange}
            required
            autoFocus
            placeholder="••••••"
            aria-invalid={error.totp ? "true" : "false"}
            suppressHydrationWarning
            className="field text-center font-mono text-lg tracking-[0.5em]"
          />
        </Field>
      )}

      <motion.button
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={isLoading}
        suppressHydrationWarning
        aria-label={
          isLoading
            ? "Loading"
            : loginStage === "credentials"
            ? "Continue to 2FA"
            : "Complete sign in"
        }
        className="btn-primary h-10 w-full text-sm"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading
          ? "Please wait…"
          : loginStage === "credentials"
          ? "Continue"
          : "Sign in"}
      </motion.button>

      {loginStage === "totp" && (
        <button
          type="button"
          onClick={() => setLoginStage("credentials")}
          className="btn-ghost w-full"
          aria-label="Back to login form"
        >
          ← Back to sign in
        </button>
      )}
    </form>
  );
}
