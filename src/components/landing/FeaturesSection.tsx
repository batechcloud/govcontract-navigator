import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { 
  Search, 
  Sparkles, 
  FileText, 
  Heart, 
  Clock,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Search in Plain English",
    description: "Just type what your business does — like 'IT support' or 'construction in Texas'. No codes or jargon needed.",
  },
  {
    icon: Sparkles,
    title: "AI Finds Your Matches",
    description: "Our AI understands your business and shows you the best-fitting contracts. You'll see 'Good Match' or 'Great Match' badges.",
  },
  {
    icon: FileText,
    title: "One-Click Proposals",
    description: "Found a contract you like? Click 'Start Bid' and let AI write your proposal draft. Review and edit it, then submit through the agency's official channel and mark it as submitted to keep your pipeline up to date.",
  },
  {
    icon: Heart,
    title: "Save & Track Favorites",
    description: "Save contracts you're interested in. See them organized in simple tabs: Saved, In Progress, and Completed.",
  },
  {
    icon: Clock,
    title: "Never Miss a Deadline",
    description: "Color-coded deadline alerts tell you exactly how many days are left. Green means plenty of time, red means hurry.",
  },
  {
    icon: Bell,
    title: "Get Notified",
    description: "We'll let you know when new contracts match your business or when deadlines are approaching.",
  },
  {
    icon: Shield,
    title: "Small Business Friendly",
    description: "Easily filter for contracts set aside for small businesses, veteran-owned, woman-owned, and minority-owned companies.",
  },
  {
    icon: HelpCircle,
    title: "AI Assistant Always Available",
    description: "Not sure about something? Ask our AI Assistant in plain English. It explains contracts, terms, and the bidding process.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Everything Made{" "}
            <span className="gradient-text-primary">Simple</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No government contracting experience? No problem. We guide you every step of the way.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card variant="glass-hover" className="h-full group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            Try it yourself — it's free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
