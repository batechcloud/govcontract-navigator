import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, FileText, TrendingUp, ArrowRight, Play } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const rotatingWords = ["Contracts", "Opportunities", "Revenue", "Success"];

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || !isInView) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, isInView, startOnView]);

  return { count, ref };
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-heading font-bold gradient-text-gold">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block w-[200px] sm:w-[280px] text-left">
      {rotatingWords.map((word, i) => (
        <motion.span
          key={word}
          className="absolute left-0 gradient-text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: i === index ? 1 : 0,
            y: i === index ? 0 : -20,
          }}
          transition={{ duration: 0.5 }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

const trustedLogos = [
  "TechBridge", "SecureNet", "GreenTech", "DataFlow", "CloudFirst"
];

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        
        {/* Dot Grid */}
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="gold" className="mb-6 animate-glow-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Contract Discovery
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-foreground mb-6 leading-tight text-shadow-lg"
          >
            Win Government{" "}
            <br className="sm:hidden" />
            <RotatingText />
            <br />
            <span className="text-muted-foreground text-2xl sm:text-4xl lg:text-5xl">with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance"
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
            <Button variant="hero" size="xl" asChild className="w-full sm:w-auto">
              <Link to="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild className="w-full sm:w-auto group">
              <Link to="/demo">
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto mb-12"
          >
            <AnimatedStat value={50} suffix="K+" label="Active Contracts" />
            <AnimatedStat value={95} suffix="%" label="AI Accuracy" />
            <AnimatedStat value={2} suffix="B+" label="Contracts Won" />
            <AnimatedStat value={10} suffix="K+" label="Users" />
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Trusted by leading contractors
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-50">
              {trustedLogos.map((logo) => (
                <span key={logo} className="text-sm font-heading font-semibold text-muted-foreground">
                  {logo}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { icon: Search, label: "Smart Search", desc: "Natural language queries" },
            { icon: Sparkles, label: "AI Match", desc: "Perfect opportunities" },
            { icon: FileText, label: "Auto Proposals", desc: "One-click generation" },
            { icon: TrendingUp, label: "Win Analytics", desc: "Track performance" },
          ].map((feature, index) => (
            <motion.div 
              key={feature.label} 
              className="glass-hover rounded-xl p-4 text-center group"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                <feature.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-heading font-semibold text-foreground text-sm mb-1">{feature.label}</div>
              <div className="text-xs text-muted-foreground">{feature.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
