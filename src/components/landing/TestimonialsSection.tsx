import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Sparkles,
  CalendarClock,
  ShieldCheck,
  FileText,
  BarChart3,
  Compass,
} from "lucide-react";

const reasons = [
  {
    icon: Search,
    title: "Plain-English search",
    description:
      "Describe what your business does and see matching federal opportunities — no NAICS memorization or SAM.gov jargon required.",
  },
  {
    icon: ShieldCheck,
    title: "Set-aside filters that matter",
    description:
      "Filter for small business, 8(a), WOSB, HUBZone, and SDVOSB set-asides so you only spend time on contracts you can actually bid.",
  },
  {
    icon: Sparkles,
    title: "AI match scoring",
    description:
      "Every opportunity is scored against your company profile so the best fits rise to the top of the list.",
  },
  {
    icon: FileText,
    title: "AI proposal drafting",
    description:
      "Turn a solicitation into a structured first draft in minutes, then edit it in the built-in editor before you submit.",
  },
  {
    icon: CalendarClock,
    title: "Deadline tracking",
    description:
      "Color-coded countdowns and a pipeline board keep every response date in front of you instead of buried in a spreadsheet.",
  },
  {
    icon: BarChart3,
    title: "Award history intelligence",
    description:
      "See what agencies actually bought, who won, and at what value using USASpending award data alongside live opportunities.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function TestimonialsSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Compass className="w-4 h-4" />
            Built for first-time federal bidders
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Why Small Businesses Choose{" "}
            <span className="gradient-text-gold">GC Navigator</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to go from "I've never bid on a federal contract"
            to a managed pipeline — in one place.
          </p>
        </motion.div>

        {/* Benefit grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {reasons.map((reason) => (
            <motion.div key={reason.title} variants={itemVariants} className="h-full">
              <Card className="h-full group border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <reason.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
