import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Search",
    description: "Find contracts that match your capabilities instantly",
  },
  {
    icon: Target,
    title: "Smart Matching",
    description: "Get personalized recommendations based on your profile",
  },
  {
    icon: FileText,
    title: "One-Click Proposals",
    description: "Generate professional proposals with AI assistance",
  },
  {
    icon: TrendingUp,
    title: "Track & Win",
    description: "Manage your pipeline and increase your win rate",
  },
];

const WelcomeStep = ({ onNext, onSkip }: WelcomeStepProps) => {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Welcome to GovAI Search
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
          Let's set up your{" "}
          <span className="gradient-text-gold">winning profile</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Complete your profile in just a few minutes to unlock personalized
          contract recommendations and AI-powered bidding tools.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
          >
            <Card variant="glass" className="p-5 text-left h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4"
      >
        <Button variant="hero" size="xl" onClick={onNext} className="group">
          Get Started
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Takes about 3 minutes •{" "}
          <button
            onClick={onSkip}
            className="text-primary hover:underline focus:outline-none"
          >
            Skip for now
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeStep;
