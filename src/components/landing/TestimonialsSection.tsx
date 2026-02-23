import { motion, animate } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Small Business Owner",
    company: "TechBridge Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    initials: "SC",
    content: "I had no idea how to find government contracts. GC Navigator made it as easy as Googling. I found my first opportunity in 10 minutes and won the contract 3 months later!",
    rating: 5,
    metric: "First win in 90 days",
    accentColor: "from-blue-500/20 to-cyan-500/20",
  },
  {
    name: "Marcus Johnson",
    role: "Veteran Business Owner",
    company: "SecureNet Services",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    initials: "MJ",
    content: "As a veteran, I knew there were contracts for me but SAM.gov was so confusing. GC Navigator's filters for veteran-owned businesses showed me exactly what I qualified for.",
    rating: 5,
    metric: "Found 20+ matches",
    accentColor: "from-emerald-500/20 to-green-500/20",
  },
  {
    name: "Emily Rodriguez",
    role: "Founder",
    company: "GreenTech Consulting",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face",
    initials: "ER",
    content: "The AI proposal writer is a game-changer. What used to take me weeks now takes an afternoon. I just review and edit the draft — it's that simple.",
    rating: 5,
    metric: "80% faster proposals",
    accentColor: "from-purple-500/20 to-pink-500/20",
  },
  {
    name: "David Park",
    role: "IT Company Owner",
    company: "CloudFirst Systems",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    initials: "DP",
    content: "I love how the deadline tracker shows me exactly how many days I have left. No more missed deadlines — the color coding makes it impossible to forget.",
    rating: 5,
    metric: "Zero missed deadlines",
    accentColor: "from-orange-500/20 to-amber-500/20",
  },
  {
    name: "Lisa Thompson",
    role: "Woman-Owned Business",
    company: "DataFlow Analytics",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    initials: "LT",
    content: "Being able to filter for woman-owned business contracts was huge. GC Navigator helped me find set-asides I didn't even know existed. Now I have a full pipeline!",
    rating: 5,
    metric: "3x more opportunities",
    accentColor: "from-indigo-500/20 to-blue-500/20",
  },
  {
    name: "Robert Kim",
    role: "Construction Company",
    company: "Precision Builders",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
    initials: "RK",
    content: "I'm not tech-savvy at all, but GC Navigator is incredibly easy to use. The AI Assistant answers my questions about contracts in plain English. It's like having a consultant on call.",
    rating: 5,
    metric: "No learning curve",
    accentColor: "from-rose-500/20 to-red-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  },
};

export function TestimonialsSection() {
  return (
    <section className="section-padding relative overflow-hidden">
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
            Loved by small business owners
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Real Business Owners,{" "}
            <span className="gradient-text-gold">Real Results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how small businesses like yours are finding and winning government contracts with GC Navigator.
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
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card className="h-full relative group overflow-hidden border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:border-primary/30 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute -top-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-20 h-20 text-accent rotate-180" />
                </div>
                
                <CardContent className="p-6 relative z-10">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-4">
                    {testimonial.metric}
                  </div>
                  
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed line-clamp-4">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold text-sm">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-foreground text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{testimonial.role}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary truncate">{testimonial.company}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
            {[
              { value: "4.9/5", label: "User Rating" },
              { value: "10K+", label: "Businesses" },
              { value: "50K+", label: "Contracts Found" },
              { value: "90%", label: "Say It's Easy" },
            ].map(stat => (
              <motion.div key={stat.label} className="space-y-1" whileHover={{ scale: 1.05 }}>
                <div className="text-3xl lg:text-4xl font-heading font-bold gradient-text-gold">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
