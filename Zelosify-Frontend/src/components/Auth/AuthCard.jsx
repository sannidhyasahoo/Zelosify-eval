import { motion } from "framer-motion";

/**
 * Key-card container used by every auth screen so they all look identical.
 */
export function AuthCard({ title, subtitle, eyebrow, children, footer }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-card-lg border border-border/70 bg-card/80 p-8 shadow-float backdrop-blur-xl"
    >
      <div className="mb-7 text-center">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
      {footer && (
        <div className="mt-6 border-t border-border/50 pt-5 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </motion.section>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2.5 text-[13px] text-coral"
    >
      {children}
    </motion.div>
  );
}

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default AuthCard;
