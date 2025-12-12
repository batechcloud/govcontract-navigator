import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, FileText, TrendingUp, ArrowRight, Play, Shield, Zap } from "lucide-react";
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
    <div ref={ref} className="text-center group">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold gradient-text-gold mb-1 group-hover:scale-105 transition-transform">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex h-[1.2em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={rotatingWords[index]}
          className="gradient-text-gold"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1] 
          }}
        >
          {rotatingWords[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Accent gradient orb */}
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.15, 0.08],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Center radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full" />
        
        {/* Refined dot grid */}
        <div className="absolute inset-0 dot-grid opacity-20" />
        
        {/* Horizontal gradient line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="gold" className="mb-8 px-4 py-1.5 text-sm animate-glow-pulse">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Contract Discovery
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-heading font-bold text-foreground mb-6 leading-[1.1] tracking-tight"
          >
            Win Government
            <br />
            <RotatingText />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Search, understand, and bid on federal, state, and grant opportunities. 
            <span className="text-foreground font-medium"> Our AI finds the perfect contracts</span>, generates winning proposals, and guides you every step of the way.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button variant="hero" size="xl" asChild className="w-full sm:w-auto text-base px-8 shadow-lg shadow-primary/25">
              <Link to="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild className="w-full sm:w-auto text-base px-8 group">
              <Link to="/demo">
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-16 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto mb-20 py-8 px-6 glass rounded-2xl"
          >
            <AnimatedStat value={50} suffix="K+" label="Active Contracts" />
            <AnimatedStat value={95} suffix="%" label="AI Accuracy" />
            <AnimatedStat value={2} suffix="B+" label="Contract Value" />
            <AnimatedStat value={10} suffix="K+" label="Happy Users" />
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {[
            { icon: Search, label: "Smart Search", desc: "Natural language queries that understand your needs" },
            { icon: Sparkles, label: "AI Match", desc: "Get perfectly matched opportunities instantly" },
            { icon: FileText, label: "Auto Proposals", desc: "Generate winning proposals with one click" },
            { icon: TrendingUp, label: "Win Analytics", desc: "Track performance and improve your win rate" },
          ].map((feature, index) => (
            <motion.div 
              key={feature.label} 
              className="glass-hover rounded-xl p-6 text-center group cursor-pointer"
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ transitionDelay: `${0.7 + index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">{feature.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
