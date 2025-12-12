import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Perfect for small businesses getting started with government contracts",
    badge: null,
    features: [
      { text: "50 contract searches/month", tooltip: "Search across all federal databases" },
      { text: "Basic AI recommendations", tooltip: "AI-powered contract matching" },
      { text: "3 proposal generations", tooltip: "Full AI-generated proposal drafts" },
      { text: "Email support", tooltip: "Response within 24 hours" },
      { text: "1 user", tooltip: null },
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: "For growing businesses serious about winning contracts",
    badge: "Most Popular",
    features: [
      { text: "Unlimited searches", tooltip: "No limits on contract searches" },
      { text: "Advanced AI matching", tooltip: "Deep analysis with match scores" },
      { text: "20 proposal generations", tooltip: "Full AI-generated proposal drafts" },
      { text: "Competitor analysis", tooltip: "Track and analyze competitor wins" },
      { text: "Pipeline tracking", tooltip: "Visual Kanban board for opportunities" },
      { text: "Priority support", tooltip: "Response within 4 hours" },
      { text: "5 users", tooltip: null },
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "For established contractors needing the full suite",
    badge: null,
    features: [
      { text: "Everything in Professional", tooltip: null },
      { text: "Unlimited proposals", tooltip: "Generate as many proposals as you need" },
      { text: "White-glove onboarding", tooltip: "Dedicated setup and training" },
      { text: "Custom integrations", tooltip: "Connect to your existing systems" },
      { text: "Dedicated success manager", tooltip: "Your personal GovAI expert" },
      { text: "Team collaboration", tooltip: "Advanced team features" },
      { text: "Unlimited users", tooltip: null },
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
  },
  {
    question: "What happens after the free trial?",
    answer: "After your 14-day free trial, you'll be automatically subscribed to your chosen plan. You can cancel before the trial ends to avoid charges."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="section-padding relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Simple, Transparent{" "}
            <span className="gradient-text-gold">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-secondary'
              }`}
              aria-label="Toggle yearly billing"
            >
              <motion.div 
                className="absolute top-1 left-1 w-5 h-5 bg-foreground rounded-full"
                animate={{ x: isYearly ? 26 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="success" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        <TooltipProvider>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={plan.popular ? "md:-mt-4 md:mb-4" : ""}
              >
                <Card 
                  variant={plan.popular ? "glass-hover" : "glass"}
                  className={`h-full relative ${plan.popular ? "border-primary/50 glow-primary scale-[1.02]" : ""}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gold" className="animate-glow-pulse">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <motion.span 
                        key={isYearly ? 'yearly' : 'monthly'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-heading font-bold text-foreground"
                      >
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </motion.span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li 
                          key={feature.text} 
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                        >
                          <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            {feature.text}
                            {feature.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{feature.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                    <Button variant={plan.variant} className="w-full" asChild>
                      <Link to={plan.name === "Enterprise" ? "/demo" : "/auth?mode=signup"}>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TooltipProvider>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-20"
        >
          <h3 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
