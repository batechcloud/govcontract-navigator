import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO, TechBridge Solutions",
    avatar: null,
    initials: "SC",
    content: "GovAI Search transformed our contract pursuit process. We went from winning 1 in 10 bids to 1 in 3. The AI proposal generator alone saved us 40 hours per month.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "BD Director, SecureNet Defense",
    avatar: null,
    initials: "MJ",
    content: "As a service-disabled veteran-owned business, finding the right set-asides was crucial. GovAI's smart filters and match scoring helped us focus on opportunities we could actually win.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Founder, GreenTech Consulting",
    avatar: null,
    initials: "ER",
    content: "I was completely new to government contracting. The step-by-step guidance and automated checklists made the whole process manageable. Won our first contract within 3 months!",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  },
};

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Trusted by{" "}
            <span className="gradient-text-gold">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join businesses that have transformed their government contracting success with GovAI Search.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
            >
              <Card variant="glass-hover" className="h-full relative group">
                {/* Quote mark */}
                <div className="absolute -top-3 -left-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Quote className="w-12 h-12 text-accent fill-accent" />
                </div>
                
                <CardContent className="p-6 pt-8">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-4 h-4 fill-accent text-accent" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={testimonial.avatar || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-heading font-semibold text-foreground text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 glass rounded-2xl p-6 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-heading font-bold gradient-text-gold">4.9/5</div>
              <div className="text-xs text-muted-foreground">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold gradient-text-gold">10K+</div>
              <div className="text-xs text-muted-foreground">Happy Users</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold gradient-text-gold">$2B+</div>
              <div className="text-xs text-muted-foreground">Contracts Won</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold gradient-text-gold">50%</div>
              <div className="text-xs text-muted-foreground">Avg Win Rate Increase</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
