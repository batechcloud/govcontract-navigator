import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Target, Heart, Zap, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to democratize government contracting, making it accessible to businesses of all sizes."
  },
  {
    icon: Heart,
    title: "Customer-First",
    description: "Every feature we build starts with our customers' needs. Your success is our success."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We leverage cutting-edge AI to solve complex problems and simplify government contracting."
  },
  {
    icon: Users,
    title: "Inclusivity",
    description: "We believe every business deserves a fair chance at government contracts, regardless of size or experience."
  }
];

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    bio: "Former government contracting officer with 15 years of experience."
  },
  {
    name: "Michael Rodriguez",
    role: "CTO & Co-Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    bio: "AI/ML expert with background at Google and Amazon."
  },
  {
    name: "Jennifer Williams",
    role: "VP of Product",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    bio: "Product leader passionate about user experience and accessibility."
  },
  {
    name: "David Park",
    role: "VP of Engineering",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    bio: "Full-stack engineer with expertise in scalable systems."
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About <span className="text-primary">GC Navigator</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're building the future of government contracting. Our AI-powered platform helps businesses 
              of all sizes discover and win government contracts.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div 
            className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 md:p-12 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                Government contracts represent over $700 billion in annual opportunities, yet the process 
                of finding and winning these contracts remains complex and inaccessible for most businesses. 
                We're changing that. GC Navigator uses artificial intelligence to simplify every step of the 
                government contracting journey, from discovery to award. We believe that with the right 
                tools, any business can compete for and win government contracts.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div 
                  key={value.title}
                  className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Team</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div 
                  key={member.name}
                  className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-all duration-300"
                >
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
