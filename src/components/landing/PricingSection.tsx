import { useState } from "react";
import { motion } from "framer-motion";
import { useSubscriptionPlans } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
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

interface PlanDef {
  name: string;
  displayName: string;
  description: string;
  monthly: number;
  yearly: number;
  badge: string | null;
  popular: boolean;
  features: PlanFeature[];
}

// Prices mirror the subscription_plans table; live values override these at runtime.
const plans: PlanDef[] = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Everything you need to start finding and tracking federal opportunities.",
    monthly: 49,
    yearly: 39,
    badge: null,
    popular: false,
    features: [
      { text: "AI-Powered Federal Contract Search" },
      { text: "Plain-English Search & Smart Filters" },
      { text: "Opportunity Pipeline Tracking" },
      { text: "Deadline Alerts & Countdown Tracking" },
      { text: "Company Profile & Match Scoring" },
      { text: "Capability Statement Generator" },
    ],
  },
  {
    name: "professional",
    displayName: "Professional",
    description: "Unlock advanced AI tools and expanded search capabilities to win more contracts.",
    monthly: 149,
    yearly: 119,
    badge: "Most Popular",
    popular: true,
    features: [
      { text: "Everything in Starter" },
      { text: "AI-Powered Proposal Generator" },
      { text: "AI-Powered Proposal Editor" },
      { text: "Deep-AI Opportunity Match Analysis" },
      { text: "Federal Award Search (USASpending)" },
      { text: "AI Document Analysis of Attachments", isNew: true },
      { text: "Saved Searches & Team Workspace" },
    ],
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Full platform access with dedicated onboarding, custom templates, and scalable team seats.",
    monthly: 399,
    yearly: 319,
    badge: null,
    popular: false,
    features: [
      { text: "Everything in Professional" },
      { text: "Dedicated Support (priority chat + video)" },
      { text: "Custom Proposal Templates" },
      { text: "Team 1:1 Onboarding" },
      { text: "Custom Training for Your Team" },
    ],
  },
];

const faqs = [
  {
    question: "Do I need government contracting experience?",
    answer: "Not at all! GC Navigator is designed specifically for beginners. Our AI guides you through every step, from finding contracts to writing proposals."
  },
  {
    question: "Can I try it for free?",
    answer: "There is no self-serve free trial today. Book a demo and our team will walk you through the platform with your own company profile and set up the plan that fits."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Cancel with one click, no questions asked. You'll keep access until the end of your billing period."
  },
  {
    question: "How does AI proposal writing work?",
    answer: "When you find a contract you want to bid on, click 'Start Bid'. Our AI reads the contract requirements and writes a professional proposal draft. You review and edit the draft, then submit it through the agency's official channel and mark it as submitted to keep your pipeline up to date."
  },
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { data: livePlans } = useSubscriptionPlans();

  const liveFor = (name: string) => livePlans?.find((p) => p.name === name);
  const priceFor = (plan: PlanDef) => {
    const live = liveFor(plan.name);
    const monthly = live?.monthly_price ?? plan.monthly;
    const yearly = live?.yearly_price ?? plan.yearly;
    return billing === "yearly" ? yearly : monthly;
  };
  const yearlyFor = (plan: PlanDef) => liveFor(plan.name)?.yearly_price ?? plan.yearly;

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

        <div className="flex items-center justify-center gap-3 mb-10">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                billing === option
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {option === "monthly" ? "Monthly" : "Annual (save up to 20%)"}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
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
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-heading font-bold text-foreground">
                      ${priceFor(plan)}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  {billing === "yearly" ? (
                    <p className="text-xs text-muted-foreground mt-1">billed annually</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${yearlyFor(plan)}/month billed annually
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
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
