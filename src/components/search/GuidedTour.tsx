import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Search, Heart, FileText, SlidersHorizontal } from "lucide-react";

const TOUR_STORAGE_KEY = "gc-search-tour-completed";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "bottom" | "top" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "search-bar",
    title: "Search for Contracts",
    description:
      "Type what your business does — like \"IT support\" or \"construction\" — and hit Search. We'll find matching government contracts for you.",
    icon: <Search className="w-5 h-5" />,
    position: "bottom",
  },
  {
    target: "quick-filters",
    title: "Filter by Business Type",
    description:
      "Use these quick filters to show only contracts your business is eligible for. For example, tap \"Small Business\" or \"Veteran-Owned.\"",
    icon: <SlidersHorizontal className="w-5 h-5" />,
    position: "bottom",
  },
  {
    target: "result-list",
    title: "Browse Results",
    description:
      "Each card shows a contract with the agency, dollar value, days left to apply, and a Fit Score showing how well it matches your business.",
    icon: <FileText className="w-5 h-5" />,
    position: "top",
  },
  {
    target: "card-actions",
    title: "Save & Learn More",
    description:
      'Found something interesting? Hit "Save" to track it, or "Learn More" to see full details and start your bid.',
    icon: <Heart className="w-5 h-5" />,
    position: "top",
  },
];

function getTooltipStyle(
  rect: DOMRect,
  position: TourStep["position"]
): React.CSSProperties {
  const gap = 16;
  const style: React.CSSProperties = { position: "fixed", zIndex: 10002 };

  switch (position) {
    case "bottom":
      style.top = rect.bottom + gap;
      style.left = Math.max(16, rect.left + rect.width / 2 - 170);
      break;
    case "top":
      style.bottom = window.innerHeight - rect.top + gap;
      style.left = Math.max(16, rect.left + rect.width / 2 - 170);
      break;
    case "right":
      style.top = rect.top + rect.height / 2 - 60;
      style.left = rect.right + gap;
      break;
    case "left":
      style.top = rect.top + rect.height / 2 - 60;
      style.right = window.innerWidth - rect.left + gap;
      break;
  }

  // Clamp horizontal
  if (style.left !== undefined) {
    style.left = Math.min(
      Number(style.left),
      window.innerWidth - 360
    );
  }

  return style;
}

export function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>();

  // Show tour if the user hasn't completed it AND we haven't already shown
  // it this browser session. Without the sessionStorage guard, navigating
  // away and coming back would pop the tour again every time, which is what
  // users hit after clearing localStorage or testing in incognito.
  useEffect(() => {
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (done) return;
    const SESSION_KEY = TOUR_STORAGE_KEY + ":session-shown";
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setActive(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const measureTarget = useCallback(() => {
    const current = tourSteps[step];
    if (!current) return;
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [step]);

  // Re-measure on step change and on scroll/resize
  useEffect(() => {
    if (!active) return;
    measureTarget();

    const onUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureTarget);
    };

    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);
    return () => {
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, step, measureTarget]);

  // Scroll target into view
  useEffect(() => {
    if (!active) return;
    const current = tourSteps[step];
    if (!current) return;
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active, step]);

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!active || !targetRect) return null;

  const currentStep = tourSteps[step];
  const spotlightPadding = 8;
  const spotlightRadius = 12;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Backdrop with spotlight cutout */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[10000]"
            onClick={handleSkip}
            style={{ pointerEvents: "auto" }}
          >
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={targetRect.left - spotlightPadding}
                    y={targetRect.top - spotlightPadding}
                    width={targetRect.width + spotlightPadding * 2}
                    height={targetRect.height + spotlightPadding * 2}
                    rx={spotlightRadius}
                    ry={spotlightRadius}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="hsl(var(--background) / 0.8)"
                mask="url(#tour-spotlight-mask)"
              />
            </svg>
          </motion.div>

          {/* Spotlight ring */}
          <motion.div
            key="tour-ring"
            className="fixed z-[10001] pointer-events-none rounded-xl border-2 border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_0_30px_hsl(var(--primary)/0.2)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: targetRect.left - spotlightPadding,
              y: targetRect.top - spotlightPadding,
              width: targetRect.width + spotlightPadding * 2,
              height: targetRect.height + spotlightPadding * 2,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ position: "fixed", top: 0, left: 0 }}
          />

          {/* Tooltip card */}
          <motion.div
            key={`tour-tooltip-${step}`}
            initial={{ opacity: 0, y: currentStep.position === "top" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: currentStep.position === "top" ? 10 : -10 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            style={getTooltipStyle(targetRect, currentStep.position)}
            className="w-[340px] z-[10002]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-xl border border-border p-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    {currentStep.icon}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Step {step + 1} of {tourSteps.length}
                    </p>
                    <h4 className="font-heading font-semibold text-sm text-foreground">
                      {currentStep.title}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {currentStep.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-primary"
                        : i < step
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      className="h-8 text-xs gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </Button>
                  )}
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleNext}
                    className="h-8 text-xs gap-1"
                  >
                    {step === tourSteps.length - 1 ? "Get Started!" : "Next"}
                    {step < tourSteps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Call this to reset the tour so it shows again */
export function resetSearchTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
