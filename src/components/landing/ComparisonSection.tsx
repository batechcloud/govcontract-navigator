import { motion } from "framer-motion";
import { Check, X, Search, FileText, Clock, HelpCircle } from "lucide-react";

const comparisonData = [
  {
    feature: "Finding Contracts",
    icon: Search,
    traditional: "Spend hours scrolling through SAM.gov",
    govai: "Type what you do, get matches instantly",
  },
  {
    feature: "Understanding Requirements",
    icon: HelpCircle,
    traditional: "Read 100+ page documents, hire consultants",
    govai: "AI explains everything in plain English",
  },
  {
    feature: "Writing Proposals",
    icon: FileText,
    traditional: "Weeks of writing from scratch",
    govai: "AI writes your first draft in minutes",
  },
  {
    feature: "Tracking Deadlines",
    icon: Clock,
    traditional: "Spreadsheets and sticky notes",
    govai: "Automatic alerts with color-coded urgency",
  },
];

export const ComparisonSection = () => {
  return (
    <section id="comparison" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Why GovAI?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
            The Old Way vs{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              The Easy Way
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Government contracting doesn't have to be complicated
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="hidden md:block" />
            <div className="col-span-3 md:col-span-1 grid grid-cols-2 gap-4 md:contents">
              <div className="glass rounded-xl p-4 text-center border border-destructive/30 bg-destructive/5">
                <span className="text-lg font-heading font-semibold text-destructive">Without GovAI</span>
              </div>
              <div className="glass rounded-xl p-4 text-center border border-success/30 bg-success/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
                <span className="text-lg font-heading font-semibold text-success relative z-10">With GovAI</span>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {comparisonData.map((item, index) => (
              <motion.div
                key={item.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 glass rounded-xl p-4 hover:bg-card/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground">{item.feature}</span>
                </div>
                <div className="flex items-center gap-3 pl-10 md:pl-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.traditional}</span>
                </div>
                <div className="flex items-center gap-3 pl-10 md:pl-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm text-foreground">{item.govai}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground mb-6">
              Join <span className="text-accent font-semibold">2,500+</span> small businesses who found contracts the easy way
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/dashboard/search"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                Start Searching Free
              </a>
              <a
                href="#features"
                className="px-8 py-3 rounded-xl border border-border bg-card/50 text-foreground font-semibold hover:bg-card transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
