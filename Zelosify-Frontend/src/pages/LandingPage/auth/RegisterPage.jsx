"use client";

import { useCallback, useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Briefcase, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import { AuthCard, FormError, Field } from "@/components/Auth/AuthCard";

const ROLE_OPTIONS = [
  {
    value: "IT_VENDOR",
    label: "IT Vendor",
    description: "Submit candidates to open roles",
    icon: Briefcase,
  },
  {
    value: "HIRING_MANAGER",
    label: "Hiring Manager",
    description: "Review candidates and decide",
    icon: ClipboardCheck,
  },
];

function PasswordInput({ id, name, value, onChange, show, onToggle, ...rest }) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={onChange}
        suppressHydrationWarning
        className="field pr-10"
        {...rest}
      />
      <button
        type="button"
        onClick={onToggle}
        suppressHydrationWarning
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Register() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "Bruce Wayne Corp",
    department: "Engineering",
    role: "IT_VENDOR",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const validateForm = useCallback(() => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    return true;
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!validateForm()) return;

      setIsLoading(true);
      try {
        const requestData = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          companyName: formData.companyName.trim(),
          department: formData.department.trim(),
          role: formData.role,
        };

        const res = await axiosInstance.post("/auth/register", requestData);

        localStorage.setItem(
          "totpSetup",
          JSON.stringify({
            qrCode: res.data.qrCode,
            otpAuthUrl: res.data.otpAuthUrl,
            email: formData.email.trim(),
          })
        );

        window.location.href = "/setup-totp";
      } catch (err) {
        if (err.response) {
          const { data } = err.response;
          const errorMessage =
            data?.message ||
            data?.error ||
            (typeof data === "string"
              ? data
              : "Registration failed. Please check your details.");
          setError(errorMessage);
        } else {
          setError(
            "Network error. Please check your connection and try again."
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, validateForm]
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-card-lg border border-border/70 bg-card/80">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      subtitle="Set up your Zelosify workspace in a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <FormError>{error}</FormError>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role picker */}
        <fieldset>
          <legend className="field-label">I am a…</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => {
              const active = formData.role === value;
              return (
                <label
                  key={value}
                  className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all ${
                    active
                      ? "border-coral/50 bg-coral/[0.07] shadow-[0_0_0_1px_rgba(255,99,99,0.25)]"
                      : "border-border/70 bg-white/[0.02] hover:border-border hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={active}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-coral" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-[13px] font-medium text-foreground">
                    {label}
                  </span>
                  <span className="text-[12px] leading-snug text-muted-foreground">
                    {description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName">
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Username" htmlFor="username">
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
          <Field label="Phone" htmlFor="phoneNumber">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
        </div>

        <Field label="Work email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            suppressHydrationWarning
            className="field"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company" htmlFor="companyName">
            <input
              id="companyName"
              name="companyName"
              autoComplete="organization"
              required
              value={formData.companyName}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
          <Field label="Department" htmlFor="department">
            <input
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              suppressHydrationWarning
              className="field"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" htmlFor="password" hint="At least 8 characters">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          suppressHydrationWarning
          className="btn-primary mt-2 h-10 w-full text-sm"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
