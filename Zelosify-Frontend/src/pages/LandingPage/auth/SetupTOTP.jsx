"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import { AuthCard, FormError, Field } from "@/components/Auth/AuthCard";

const STEPS = [
  "Scan this QR code with Google Authenticator, Authy or Microsoft Authenticator.",
  "Your app will show a 6-digit code that refreshes every 30 seconds.",
  "Enter the current code below to finish setting up your account.",
];

export default function SetupTOTP() {
  const [qrCode, setQrCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loadError, setLoadError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedTOTP = localStorage.getItem("totpSetup");
    if (storedTOTP) {
      try {
        const parsedTOTP = JSON.parse(storedTOTP);
        if (parsedTOTP.qrCode) {
          setQrCode(parsedTOTP.qrCode);
        } else {
          setLoadError("Invalid setup data. The QR code is missing.");
        }
      } catch (err) {
        setLoadError("We couldn't read your setup data.");
        console.error("TOTP parse error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setLoadError("Setup data not found. Please register again.");
      setIsLoading(false);
    }
  }, []);

  const handleVerifyTOTP = async (e) => {
    e.preventDefault();

    const code = totpCode.trim();
    if (!code) {
      setVerifyError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setVerifyError("The code must be exactly 6 digits.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      // The backend identifies the user via the registration_token cookie
      const response = await axiosInstance.post("/auth/verify-initial-totp", {
        totp: code,
      });

      localStorage.removeItem("totpSetup");

      const userRole = response.data?.user?.role;
      if (userRole === "HIRING_MANAGER") {
        window.location.href = "/hiring-manager/openings";
      } else if (userRole === "IT_VENDOR") {
        window.location.href = "/vendor/openings";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setVerifyError("That code isn't valid. Check your app and try again.");
      } else if (status === 400) {
        setLoadError("Your registration session expired. Please register again.");
        setTimeout(() => router.push("/register"), 3000);
      } else if (status === 500) {
        setVerifyError(
          "Something went wrong on our side. Please try again in a moment."
        );
      } else {
        setVerifyError(
          err.response?.data?.message ||
            "Verification failed. Please try again."
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Step 2 of 2"
      title="Secure your account"
      subtitle="Set up two-factor authentication to finish."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <div>
          <FormError>{loadError}</FormError>
          <button
            onClick={() => router.push("/register")}
            className="btn-secondary w-full"
          >
            Back to registration
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {qrCode && (
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-[0_0_40px_0_rgba(255,99,99,0.15)]">
                <img
                  src={qrCode}
                  alt="Authenticator QR code"
                  className="h-44 w-44"
                />
              </div>
            </div>
          )}

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-[13px] leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-accent font-mono text-[11px] text-muted-foreground">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={handleVerifyTOTP} className="space-y-4">
            <FormError>{verifyError}</FormError>
            <Field label="Verification code" htmlFor="totpCode">
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                suppressHydrationWarning
                className="field text-center font-mono text-lg tracking-[0.5em]"
              />
            </Field>

            <button
              type="submit"
              disabled={isVerifying}
              suppressHydrationWarning
              className="btn-primary h-10 w-full text-sm"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isVerifying ? "Verifying…" : "Verify and continue"}
            </button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground">
            Keep your authenticator app safe — you&apos;ll need a code every
            time you sign in.
          </p>
        </div>
      )}
    </AuthCard>
  );
}
