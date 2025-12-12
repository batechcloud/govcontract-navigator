import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO",
    company: "TechBridge Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    initials: "SC",
    content: "GovAI Search transformed our contract pursuit process. We went from winning 1 in 10 bids to 1 in 3. The AI proposal generator alone saved us 40 hours per month.",
    rating: 5,
    metric: "3x win rate",
    accentColor: "from-blue-500/20 to-cyan-500/20",
  },
  {
    name: "Marcus Johnson",
    role: "BD Director",
    company: "SecureNet Defense",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    initials: "MJ",
    content: "As a service-disabled veteran-owned business, finding the right set-asides was crucial. GovAI's smart filters and match scoring helped us focus on opportunities we could actually win.",
    rating: 5,
    metric: "85% match accuracy",
    accentColor: "from-emerald-500/20 to-green-500/20",
  },
  {
    name: "Emily Rodriguez",
    role: "Founder",
    company: "GreenTech Consulting",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face",
    initials: "ER",
    content: "I was completely new to government contracting. The step-by-step guidance and automated checklists made the whole process manageable. Won our first contract within 3 months!",
    rating: 5,
    metric: "First win in 90 days",
    accentColor: "from-purple-500/20 to-pink-500/20",
  },
  {
    name: "David Park",
    role: "Operations Manager",
    company: "CloudFirst Systems",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    initials: "DP",
    content: "The competitor intelligence feature alone is worth the subscription. We can now see exactly who we're bidding against and adjust our strategy accordingly.",
    rating: 5,
    metric: "40% more competitive",
    accentColor: "from-orange-500/20 to-amber-500/20",
  },
  {
    name: "Lisa Thompson",
    role: "Contracts Director",
    company: "DataFlow Analytics",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    initials: "LT",
    content: "We've reduced our proposal development time by 60%. The AI understands government language and helps us craft responses that resonate with evaluators.",
    rating: 5,
    metric: "60% faster proposals",
    accentColor: "from-indigo-500/20 to-blue-500/20",
  },
  {
    name: "Robert Kim",
    role: "CEO",
    company: "Precision Defense",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
    initials: "RK",
    content: "From discovery to submission, GovAI streamlined everything. Our team can now manage 3x more opportunities with the same headcount.",
    rating: 5,
    metric: "3x capacity",
    accentColor: "from-rose-500/20 to-red-500/20",
  },
];

const companyLogos = [
  "TechBridge", "SecureNet", "GreenTech", "CloudFirst", "DataFlow", "Precision"
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [value]);
  
  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    }
  },
};

export function TestimonialsSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium mb-6"
          >
            <Star className="w-4 h-4 fill-success" />
            4.9/5 from 10,000+ reviews
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Loved by{" "}
            <span className="gradient-text-gold">Contractors</span>
            {" "}Nationwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses that have transformed their government contracting success with GovAI Search.
          </p>
        </motion.div>

        {/* Testimonial Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card className="h-full relative group overflow-hidden border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:border-primary/30 transition-all duration-300">
                {/* Accent gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Quote mark */}
                <div className="absolute -top-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-20 h-20 text-accent rotate-180" />
                </div>
                
                <CardContent className="p-6 relative z-10">
                  {/* Metric badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-4">
                    {testimonial.metric}
                  </div>
                  
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }}
                      >
                        <Star className="w-4 h-4 fill-accent text-accent" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed line-clamp-4">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold text-sm">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-foreground text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {testimonial.role}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary truncate">
                          {testimonial.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Company logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">
            Trusted by companies of all sizes
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {companyLogos.map((logo, index) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                className="glass px-6 py-3 rounded-xl"
              >
                <span className="text-base font-heading font-semibold text-muted-foreground/70 hover:text-foreground transition-colors">
                  {logo}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-2xl p-8 max-w-4xl mx-auto border border-primary/20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-3xl lg:text-4xl font-heading font-bold gradient-text-gold">4.9/5</div>
              <div className="text-xs text-muted-foreground font-medium">Average Rating</div>
            </motion.div>
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-3xl lg:text-4xl font-heading font-bold gradient-text-gold">10K+</div>
              <div className="text-xs text-muted-foreground font-medium">Happy Users</div>
            </motion.div>
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-3xl lg:text-4xl font-heading font-bold gradient-text-gold">$2B+</div>
              <div className="text-xs text-muted-foreground font-medium">Contracts Won</div>
            </motion.div>
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-3xl lg:text-4xl font-heading font-bold gradient-text-gold">50%</div>
              <div className="text-xs text-muted-foreground font-medium">Win Rate Increase</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
