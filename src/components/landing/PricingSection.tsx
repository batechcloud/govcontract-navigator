import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for small businesses getting started with government contracts",
    badge: null,
    features: [
      "50 contract searches/month",
      "Basic AI recommendations",
      "3 proposal generations",
      "Email support",
      "1 user",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
  },
  {
    name: "Professional",
    price: 199,
    description: "For growing businesses serious about winning contracts",
    badge: "Most Popular",
    features: [
      "Unlimited searches",
      "Advanced AI matching",
      "20 proposal generations",
      "Competitor analysis",
      "Pipeline tracking",
      "Priority support",
      "5 users",
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
  },
  {
    name: "Enterprise",
    price: 499,
    description: "For established contractors needing the full suite",
    badge: null,
    features: [
      "Everything in Professional",
      "Unlimited proposals",
      "White-glove onboarding",
      "Custom integrations",
      "Dedicated success manager",
      "Team collaboration",
      "Unlimited users",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Simple, Transparent{" "}
            <span className="gradient-text-gold">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={index === 1 ? "md:-mt-4 md:mb-4" : ""}
            >
              <Card 
                variant={index === 1 ? "glass-hover" : "glass"}
                className={`h-full relative ${index === 1 ? "border-primary/50 glow-primary" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gold">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-heading font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant} className="w-full" asChild>
                    <Link to="/auth?mode=signup">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
