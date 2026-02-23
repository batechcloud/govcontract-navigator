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
    description: "Perfect for getting started with government contracts",
    badge: null,
    features: [
      { text: "50 contract searches/month", tooltip: "Search across federal and state databases" },
      { text: "AI contract matching", tooltip: "See which contracts fit your business" },
      { text: "Save & track contracts", tooltip: "Keep your favorites organized" },
      { text: "Deadline reminders", tooltip: "Never miss a due date" },
      { text: "Email support", tooltip: "We're here to help" },
      { text: "1 user", tooltip: null },
    ],
    cta: "Start Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: "For businesses ready to win more contracts",
    badge: "Most Popular",
    features: [
      { text: "500 searches/month", tooltip: "Search all federal and state databases" },
      { text: "AI proposal writing", tooltip: "Let AI draft your proposals" },
      { text: "5 AI proposals/month", tooltip: "Full AI-generated proposal drafts" },
      { text: "Unlimited saves & tracking", tooltip: "Save as many contracts as you want" },
      { text: "AI Assistant chat", tooltip: "Ask questions about any contract" },
      { text: "Priority support", tooltip: "Fast responses when you need help" },
      { text: "5 users", tooltip: null },
    ],
    cta: "Start Free",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 399,
    yearlyPrice: 319,
    description: "For teams that need everything unlimited",
    badge: null,
    features: [
      { text: "Unlimited searches", tooltip: "No limits" },
      { text: "Unlimited AI proposals", tooltip: "Write as many bids as you need" },
      { text: "Team collaboration", tooltip: "Work together on proposals" },
      { text: "Dedicated support", tooltip: "Your own account manager" },
      { text: "Custom onboarding", tooltip: "We set everything up for you" },
      { text: "Unlimited users", tooltip: null },
    ],
    cta: "Contact Us",
    variant: "outline" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "Do I need government contracting experience?",
    answer: "Not at all! GC Navigator is designed specifically for beginners. Our AI guides you through every step, from finding contracts to writing proposals."
  },
  {
    question: "Can I try it for free?",
    answer: "Yes! You can start searching for contracts immediately. No credit card required for the free trial."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Cancel with one click, no questions asked. You'll keep access until the end of your billing period."
  },
  {
    question: "How does AI proposal writing work?",
    answer: "When you find a contract you want to bid on, click 'Start Bid'. Our AI reads the contract requirements and writes a professional proposal draft. You review it, make edits, and submit."
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
            Simple{" "}
            <span className="gradient-text-gold">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Upgrade when you're ready. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-primary' : 'bg-secondary'}`}
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
              <Badge variant="success" className="ml-2">Save 20%</Badge>
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
                      {plan.features.map((feature, fi) => (
                        <motion.li 
                          key={feature.text} 
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + fi * 0.05 }}
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
                      <Link to={plan.name === "Enterprise" ? "/contact" : "/auth?mode=signup"}>
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

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-20"
        >
          <h3 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
            Common Questions
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
