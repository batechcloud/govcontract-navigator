import { motion } from "framer-motion";
import { Check, X, Zap, Clock, Brain, Shield } from "lucide-react";

const comparisonData = [
  {
    feature: "Contract Discovery",
    icon: Zap,
    traditional: "Manual SAM.gov searches, hours of scrolling",
    govai: "AI-powered instant search with smart filters",
    traditionalHas: false,
    govaiHas: true,
  },
  {
    feature: "Understanding Requirements",
    icon: Brain,
    traditional: "Read 100+ page RFPs, hire consultants",
    govai: "AI interprets and summarizes in seconds",
    traditionalHas: false,
    govaiHas: true,
  },
  {
    feature: "Proposal Writing",
    icon: Clock,
    traditional: "Weeks of manual writing and revisions",
    govai: "One-click AI-generated proposals",
    traditionalHas: false,
    govaiHas: true,
  },
  {
    feature: "Deadline Tracking",
    icon: Shield,
    traditional: "Spreadsheets and calendar reminders",
    govai: "Automated pipeline with smart alerts",
    traditionalHas: false,
    govaiHas: true,
  },
  {
    feature: "Match Scoring",
    icon: Brain,
    traditional: "Gut feeling and guesswork",
    govai: "AI-powered company fit analysis",
    traditionalHas: false,
    govaiHas: true,
  },
  {
    feature: "Competitor Intel",
    icon: Shield,
    traditional: "Expensive market research firms",
    govai: "Real-time USAspending data integration",
    traditionalHas: false,
    govaiHas: true,
  },
];

export const ComparisonSection = () => {
  return (
    <section id="comparison" className="py-24 relative overflow-hidden">
      {/* Background effects */}
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
            Why Choose GovAI
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
            Traditional Methods vs{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              GovAI Search
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See why thousands of contractors are switching to AI-powered contract discovery
          </p>
        </motion.div>

        {/* Comparison Table */}
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
                <span className="text-lg font-heading font-semibold text-destructive">
                  Traditional
                </span>
              </div>
              <div className="glass rounded-xl p-4 text-center border border-success/30 bg-success/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
                <span className="text-lg font-heading font-semibold text-success relative z-10">
                  GovAI Search
                </span>
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
                {/* Feature Name */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground">{item.feature}</span>
                </div>

                {/* Traditional */}
                <div className="flex items-center gap-3 pl-10 md:pl-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.traditional}</span>
                </div>

                {/* GovAI */}
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
              Join <span className="text-accent font-semibold">2,500+</span> contractors who've upgraded their workflow
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/auth"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                Start Free Trial
              </a>
              <a
                href="#features"
                className="px-8 py-3 rounded-xl border border-border bg-card/50 text-foreground font-semibold hover:bg-card transition-all duration-300"
              >
                See All Features
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
