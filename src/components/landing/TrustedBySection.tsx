import { motion } from "framer-motion";

const logos = [
  { name: "TechBridge", width: "w-28" },
  { name: "SecureNet", width: "w-28" },
  { name: "GreenTech", width: "w-28" },
  { name: "DataFlow", width: "w-24" },
  { name: "CloudFirst", width: "w-28" },
  { name: "InnoSys", width: "w-24" },
  { name: "FedLogic", width: "w-28" },
  { name: "GovWorks", width: "w-28" },
];

export function TrustedBySection() {
  return (
    <section className="py-12 relative overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8"
        >
          Trusted by small businesses across the country
        </motion.p>
        
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden">
            <motion.div 
              className="flex items-center gap-12 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...logos, ...logos].map((logo, index) => (
                <div 
                  key={`${logo.name}-${index}`}
                  className={`${logo.width} flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors`}
                >
                  <span className="font-heading font-bold text-lg tracking-tight">{logo.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
