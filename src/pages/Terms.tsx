import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service – GC Navigator</title>
        <meta name="description" content="Read GC Navigator's terms of service governing the use of our government contracting platform." />
        <link rel="canonical" href="https://gc-navigator.lovable.app/terms" />
      </Helmet>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 13, 2024</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using GC Navigator's platform and services, you agree to be bound by these 
                  Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  GC Navigator provides an AI-powered platform for discovering, analyzing, and bidding on 
                  government contracts. Our services include contract search, AI-assisted proposal 
                  generation, competitive intelligence, and submission management tools.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>You may not share your account with others or transfer it without our consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Subscription and Billing</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Subscriptions are billed monthly or annually based on your chosen plan</li>
                  <li>Prices may change with 30 days notice</li>
                  <li>Refunds are provided at our discretion</li>
                  <li>You may cancel your subscription at any time; access continues until the end of the billing period</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Scrape or collect data from our platform without permission</li>
                  <li>Resell or redistribute our services without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. AI-Generated Content</h2>
                <p className="text-muted-foreground">
                  Our AI features generate content to assist with proposals and analysis. This content 
                  is provided as a starting point and should be reviewed and modified before use. 
                  You are responsible for ensuring the accuracy and compliance of any proposals you submit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  GC Navigator and its content, features, and functionality are owned by us and are protected 
                  by intellectual property laws. You retain ownership of content you create using our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground">
                  Our services are provided "as is" without warranties of any kind. We do not guarantee 
                  that you will win any government contracts through our platform. Contract awards are 
                  determined solely by the issuing government agencies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, GC Navigator shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages resulting from your use of 
                  our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact us at:
                </p>
                <p className="text-muted-foreground mt-4">
                  Email: legal@gcnavigator.com<br />
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
