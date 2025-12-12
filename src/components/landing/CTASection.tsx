import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, CreditCard, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const trustItems = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: Clock, text: "14-day free trial" },
  { icon: Shield, text: "Cancel anytime" },
];

export function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center glass rounded-3xl p-8 sm:p-12 lg:p-16 glow-primary gradient-border relative overflow-hidden group"
        >
          {/* Animated border effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-gradient-shift" />
          </div>

          <div className="relative z-10">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 animate-glow-pulse" />
              Start your 14-day free trial today
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
              Ready to Win Your First{" "}
              <span className="gradient-text-gold">Government Contract?</span>
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of businesses using AI to discover opportunities, generate winning proposals, and grow their government revenue.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button variant="gold" size="xl" asChild className="w-full sm:w-auto group">
                <Link to="/auth?mode=signup">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild className="w-full sm:w-auto">
                <Link to="/demo">
                  Schedule Demo
                </Link>
              </Button>
            </div>
            
            {/* Trust items */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {trustItems.map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-success" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
