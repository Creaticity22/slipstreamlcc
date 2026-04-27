import { motion } from "framer-motion";
import { ReactNode } from "react";
import Logo from "./Logo";

interface BrandHeaderProps {
  /** Optional right-aligned action (e.g. notification bell). */
  action?: ReactNode;
  /** Optional title rendered below the logo. */
  title?: ReactNode;
  /** Optional supporting line under the title. */
  subtitle?: ReactNode;
}

/**
 * Shared hero brand block used across top-level pages.
 * Ensures the Slipstream lockup is presented at the same prominent size
 * and alignment everywhere.
 */
const BrandHeader = ({ action, title, subtitle }: BrandHeaderProps) => {
  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between gap-3 mb-4"
      >
        <Logo size={120} className="-ml-2" />
        {action && <div className="shrink-0">{action}</div>}
      </motion.div>
      {(title || subtitle) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {title && (
            <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BrandHeader;
