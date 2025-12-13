import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    title: "5 Common Mistakes First-Time Government Contractors Make",
    excerpt: "Avoid these pitfalls when pursuing your first government contract. Learn from experienced contractors who've been there.",
    author: "Sarah Chen",
    date: "Dec 10, 2024",
    category: "Getting Started",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop"
  },
  {
    title: "How AI is Transforming Government Contract Search",
    excerpt: "Discover how artificial intelligence is making it easier than ever to find and win government contracts.",
    author: "Michael Rodriguez",
    date: "Dec 8, 2024",
    category: "AI & Technology",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop"
  },
  {
    title: "Understanding Set-Asides: A Complete Guide",
    excerpt: "Everything you need to know about small business set-asides, 8(a), HUBZone, and other preference programs.",
    author: "Jennifer Williams",
    date: "Dec 5, 2024",
    category: "Compliance",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop"
  },
  {
    title: "Writing Winning Technical Approaches",
    excerpt: "Tips and strategies for crafting technical approaches that stand out from the competition.",
    author: "David Park",
    date: "Dec 3, 2024",
    category: "Proposals",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop"
  },
  {
    title: "SAM.gov Changes Coming in 2025",
    excerpt: "What contractors need to know about upcoming changes to the System for Award Management.",
    author: "Lisa Thompson",
    date: "Nov 30, 2024",
    category: "News",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
  },
  {
    title: "Building Your Capability Statement",
    excerpt: "A step-by-step guide to creating a compelling capability statement that wins contracts.",
    author: "Robert Johnson",
    date: "Nov 28, 2024",
    category: "Getting Started",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              GovAI <span className="text-primary">Blog</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, tips, and news to help you succeed in government contracting.
            </p>
          </motion.div>

          {/* Featured Post */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                <img 
                  src={blogPosts[0].image} 
                  alt={blogPosts[0].title}
                  className="w-full h-64 md:h-full object-cover"
                />
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-4 bg-primary/20 text-primary">{blogPosts[0].category}</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{blogPosts[0].title}</h2>
                  <p className="text-muted-foreground mb-6">{blogPosts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {blogPosts[0].author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {blogPosts[0].date}
                    </span>
                  </div>
                  <Link to="#" className="text-primary hover:text-primary/80 flex items-center gap-2 font-medium">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.slice(1).map((post, index) => (
              <motion.div
                key={post.title}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <Badge className="mb-3 bg-primary/20 text-primary">{post.category}</Badge>
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
