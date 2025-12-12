import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, FileText, TrendingUp, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="gold" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Contract Discovery
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-foreground mb-6 leading-tight"
          >
            Win Government Contracts{" "}
            <span className="gradient-text-primary">with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Search, understand, and bid on federal, state, and grant opportunities. 
            Our AI finds the perfect contracts, generates winning proposals, and guides you every step of the way.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/demo">
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { value: "50K+", label: "Active Contracts" },
              { value: "95%", label: "AI Accuracy" },
              { value: "$2B+", label: "Contracts Won" },
              { value: "10K+", label: "Users" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-heading font-bold gradient-text-gold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { icon: Search, label: "Smart Search", desc: "Natural language queries" },
            { icon: Sparkles, label: "AI Match", desc: "Perfect opportunities" },
            { icon: FileText, label: "Auto Proposals", desc: "One-click generation" },
            { icon: TrendingUp, label: "Win Analytics", desc: "Track performance" },
          ].map((feature) => (
            <div key={feature.label} className="glass-hover rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="font-heading font-semibold text-foreground text-sm mb-1">{feature.label}</div>
              <div className="text-xs text-muted-foreground">{feature.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
