import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 13, 2024</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground">
                  GC Navigator ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  platform and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">We collect information in the following ways:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Account Information:</strong> Name, email address, company name, and contact details when you register.</li>
                  <li><strong className="text-foreground">Company Profile:</strong> NAICS codes, certifications, capabilities, and past performance data you provide.</li>
                  <li><strong className="text-foreground">Usage Data:</strong> How you interact with our platform, including searches, saved opportunities, and proposals.</li>
                  <li><strong className="text-foreground">Device Information:</strong> Browser type, IP address, and device identifiers for security and analytics.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide and improve our AI-powered contract matching services</li>
                  <li>Generate personalized contract recommendations</li>
                  <li>Create AI-assisted proposals tailored to your company profile</li>
                  <li>Send notifications about relevant opportunities and deadlines</li>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Service providers who assist in operating our platform</li>
                  <li>Analytics partners to improve our services</li>
                  <li>Law enforcement when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including encryption, secure 
                  data centers, and regular security audits. We are SOC 2 compliant and follow 
                  government security standards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Access and receive a copy of your data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-muted-foreground mt-4">
                  Email: privacy@gcnavigator.com<br />
                  Address: 123 Government Way, Washington, DC 20001
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
