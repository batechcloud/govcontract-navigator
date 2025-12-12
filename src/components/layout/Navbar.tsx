import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">G</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Gov<span className="gradient-text-gold">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/solutions" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Solutions
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Docs
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Blog
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link 
                to="/solutions" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Solutions
              </Link>
              <Link 
                to="/pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                to="/docs" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Docs
              </Link>
              <Link 
                to="/blog" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button variant="hero" asChild className="w-full justify-center">
                  <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
