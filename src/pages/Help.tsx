import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Mail, Phone, FileQuestion, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "What is GovAI and how does it work?",
    answer: "GovAI is an AI-powered platform that helps you discover, understand, and bid on government contracts. Our AI analyzes contract opportunities, matches them to your business capabilities, and helps you create winning proposals."
  },
  {
    question: "Do I need any prior government contracting experience?",
    answer: "No! GovAI is designed for beginners. We guide you through every step of the process, from understanding contracts to submitting proposals. Our AI explains complex government terminology in plain language."
  },
  {
    question: "What databases does GovAI search?",
    answer: "GovAI searches SAM.gov for federal opportunities, as well as state and local databases. We also provide access to DIBBS for defense logistics opportunities and track competitor awards through USAspending.gov."
  },
  {
    question: "How does the AI proposal generator work?",
    answer: "Our AI analyzes the contract requirements and your company profile to generate a complete proposal draft. It creates your executive summary, technical approach, management plan, and past performance sections, which you can then edit and customize."
  },
  {
    question: "Is my company data secure?",
    answer: "Absolutely. We use enterprise-grade encryption and security measures. Your data is stored securely and never shared with third parties. We're SOC 2 compliant and follow government security standards."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your access will continue until the end of your current billing period."
  },
  {
    question: "What certifications should I have to use GovAI?",
    answer: "You don't need any specific certifications to use GovAI. However, having certifications like 8(a), HUBZone, WOSB, or SDVOSB can help you qualify for set-aside contracts. GovAI helps you identify opportunities that match your certifications."
  },
  {
    question: "How do I get my SAM.gov UEI number?",
    answer: "You can register for a UEI (Unique Entity Identifier) through SAM.gov. It's free and required for government contracting. GovAI provides guides to help you through the registration process."
  }
];

const supportOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team in real-time.",
    action: "Start Chat",
    href: "#"
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email within 24 hours.",
    action: "Send Email",
    href: "mailto:support@govai.com"
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Talk to an expert (Pro & Enterprise).",
    action: "Call Us",
    href: "tel:+18005551234"
  }
];

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Help Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How Can We <span className="text-primary">Help?</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions or get in touch with our support team.
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search for help..." 
                className="pl-12 h-12 bg-card/50 border-border/50"
              />
            </div>
          </motion.div>

          {/* Support Options */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {supportOptions.map((option) => (
              <div 
                key={option.title}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                <Button variant="outline" asChild>
                  <Link to={option.href}>{option.action}</Link>
                </Button>
              </div>
            ))}
          </motion.div>

          {/* FAQs */}
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <FileQuestion className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/50"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline">
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
      </main>

      <Footer />
    </div>
  );
}
