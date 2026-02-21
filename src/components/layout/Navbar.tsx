import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, HelpCircle, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { to: "/solutions", label: "Solutions", isSection: false },
  { to: "/#features", label: "Features", isSection: true },
  { to: "/#pricing", label: "Pricing", isSection: true },
  { to: "/docs", label: "Docs", isSection: false },
  { to: "/tutorials", label: "Tutorials", isSection: false },
  { to: "/blog", label: "Blog", isSection: false },
];

const scrollToSection = (sectionId: string) => {
  const element = document.querySelector(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActiveLink = (link: typeof navLinks[0]) => {
    if (link.isSection) {
      // For section links, check if we're on home page
      return location.pathname === "/" && location.hash === link.to.replace("/", "");
    }
    if (link.to === "/" && location.pathname === "/") return true;
    if (link.to !== "/" && location.pathname.startsWith(link.to)) return true;
    return false;
  };

  const handleNavClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (link.isSection && location.pathname === "/") {
      e.preventDefault();
      const sectionId = link.to.replace("/#", "#");
      scrollToSection(sectionId);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "glass border-b border-border/50 shadow-lg" 
          : "bg-transparent"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
            aria-label="GC Navigator - Home"
          >
            <motion.div 
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-primary-foreground font-heading font-bold text-lg">GC</span>
            </motion.div>
            <span className="font-heading font-bold text-xl text-foreground">
              GC <span className="gradient-text-gold">Navigator</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                onClick={(e) => handleNavClick(e, link)}
                className={`relative text-sm font-medium transition-colors link-underline py-1 ${
                  isActiveLink(link) 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActiveLink(link) && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
            <Link 
              to="/help" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Help Center"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-border/50">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link 
                        to={link.to} 
                        onClick={(e) => handleNavClick(e, link)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors text-sm font-medium ${
                          isActiveLink(link)
                            ? "text-foreground bg-secondary/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.05 }}
                  >
                    <Link 
                      to="/help" 
                      className="flex items-center gap-2 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors text-sm font-medium"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help Center
                    </Link>
                  </motion.div>
                  <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border/50">
                    <Button variant="ghost" asChild className="w-full justify-center">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                    <Button variant="hero" asChild className="w-full justify-center">
                      <Link to="/auth?mode=signup">Get Started</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
