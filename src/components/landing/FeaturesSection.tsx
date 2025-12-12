import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Brain, 
  FileText, 
  BarChart3, 
  Users, 
  Bell,
  Shield,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Contract Search",
    description: "Search federal, state, and grant opportunities using natural language. Our AI understands your business and finds matching contracts instantly.",
  },
  {
    icon: Brain,
    title: "AI Match Analysis",
    description: "Get detailed match scores showing exactly how well your company fits each opportunity. No more guessing.",
  },
  {
    icon: FileText,
    title: "Proposal Generator",
    description: "Generate complete, professional proposals with one click. Our AI uses your company profile and past wins to create winning bids.",
  },
  {
    icon: BarChart3,
    title: "Pipeline Tracking",
    description: "Track all your opportunities in a visual Kanban board. From discovery to award, never miss a deadline.",
  },
  {
    icon: Users,
    title: "Competitor Intelligence",
    description: "Analyze competitor wins using USAspending data. Understand the market and position yourself to win.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about new opportunities, upcoming deadlines, and contract amendments. Stay ahead of the competition.",
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    description: "Automated submission checklists ensure you never miss required documents or compliance requirements.",
  },
  {
    icon: Zap,
    title: "Beginner Friendly",
    description: "Step-by-step guidance through the entire process. Perfect for businesses new to government contracting.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text-primary">Win Contracts</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From discovery to award, GovAI Search streamlines every step of the government contracting process.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="glass-hover" className="h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
