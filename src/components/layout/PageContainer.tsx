import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type PageContainerVariant = "narrow" | "default" | "wide" | "full";

interface PageContainerProps {
  children: ReactNode;
  variant?: PageContainerVariant;
  animate?: boolean;
  className?: string;
  as?: "div" | "motion.div";
}

const maxWidthMap: Record<PageContainerVariant, string> = {
  narrow: "max-w-3xl",
  default: "max-w-4xl",
  wide: "max-w-7xl",
  full: "",
};

export function PageContainer({
  children,
  variant = "default",
  animate = true,
  className,
  as,
}: PageContainerProps) {
  const baseClasses = cn(
    "mx-auto w-full",
    maxWidthMap[variant],
    className
  );

  if (animate && as !== "div") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={baseClasses}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
