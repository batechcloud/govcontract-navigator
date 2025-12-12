import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO, TechBridge Solutions",
    content: "GovAI Search transformed our contract pursuit process. We went from winning 1 in 10 bids to 1 in 3. The AI proposal generator alone saved us 40 hours per month.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "BD Director, SecureNet Defense",
    content: "As a service-disabled veteran-owned business, finding the right set-asides was crucial. GovAI's smart filters and match scoring helped us focus on opportunities we could actually win.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Founder, GreenTech Consulting",
    content: "I was completely new to government contracting. The step-by-step guidance and automated checklists made the whole process manageable. Won our first contract within 3 months!",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Trusted by{" "}
            <span className="gradient-text-gold">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join businesses that have transformed their government contracting success with GovAI Search.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="glass-hover" className="h-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-heading font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
