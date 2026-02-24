import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PlanFeature {
  text: string;
  isNew?: boolean;
}

const plans = [
  {
    name: "Pro",
    description: "Unlock advanced AI tools and expanded search capabilities to win more contracts.",
    badge: "Most Popular",
    popular: true,
    features: [
      { text: "Everything in Starter" },
      { text: "AI-Powered State, Local and Education Search" },
      { text: "AI-Powered DIBBS & Forecasts", isNew: true },
      { text: "AI-Powered Prime & Subcontractor Search", isNew: true },
      { text: "AI-Powered Partnership Search", isNew: true },
      { text: "Federal Award Search", isNew: true },
      { text: "Market Watch", isNew: true },
      { text: "Small Business Specialists Directory", isNew: true },
      { text: "AI-Powered Grants Search" },
      { text: "AI-Powered SBIR/STTR Search" },
      { text: "AI-Powered Proposal Generator" },
      { text: "AI-Powered Proposal Editor" },
      { text: "Project Management Journey" },
      { text: "Deep-AI Opportunity Match Analysis" },
    ] as PlanFeature[],
  },
  {
    name: "Enterprise",
    description: "Full platform access with dedicated onboarding, custom templates, and scalable team seats.",
    badge: null,
    popular: false,
    features: [
      { text: "Everything in Professional" },
      { text: "Dedicated Support (priority chat + video)" },
      { text: "Custom Proposal Templates" },
      { text: "Team 1:1 Onboarding" },
      { text: "Custom Training for Your Team" },
    ] as PlanFeature[],
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
            Choose Your{" "}
            <span className="gradient-text-gold">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get the tools you need to find and win government contracts. Book a demo to get started.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                variant={plan.popular ? "glass-hover" : "glass"}
                className={`h-full relative overflow-visible ${plan.popular ? "border-primary/50 glow-primary mt-4" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gold" className="animate-glow-pulse">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
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
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          {feature.text}
                          {feature.isNew && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">New</Badge>
                          )}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <Button variant={plan.popular ? "hero" : "outline"} className="w-full" asChild>
                    <Link to="/contact">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Book a Demo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
