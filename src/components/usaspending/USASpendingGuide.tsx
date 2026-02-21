import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const USASpendingGuide = () => (
  <div>
    <h3 className="text-lg font-heading font-semibold text-foreground mb-4">How to Use USASpending Data</h3>
    <div className="bg-card border border-border rounded-lg p-4">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="what-is">
          <AccordionTrigger className="text-foreground">What is USASpending.gov?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            USASpending.gov is the official open data source for federal spending. It tracks every dollar the government spends — contracts, grants, loans, and direct payments. Updated daily, it covers $50+ trillion in spending since 2008. All data is free and publicly accessible with no API key required.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="market-research">
          <AccordionTrigger className="text-foreground">How to use this data for market research</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
            <p>• Use <strong>Top Agencies</strong> to identify which departments spend most in your sector</p>
            <p>• Use <strong>Top Recipients</strong> to understand who your competition is</p>
            <p>• Use <strong>Geographic data</strong> to find where contracts are concentrated</p>
            <p>• Use <strong>Spending Trends</strong> to time your BD efforts around budget cycles</p>
            <p>• Cross-reference with SAM.gov to find open solicitations</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="award-types">
          <AccordionTrigger className="text-foreground">Understanding Award Types</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50"><td className="p-2">A</td><td className="p-2">BPA Call</td><td className="p-2">Blanket Purchase Agreement order</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">B</td><td className="p-2">Purchase Order</td><td className="p-2">Simple purchase under SAT</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">C</td><td className="p-2">Delivery Order</td><td className="p-2">Order under indefinite delivery contract</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">D</td><td className="p-2">Definitive Contract</td><td className="p-2">Standard contract award</td></tr>
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fiscal-year">
          <AccordionTrigger className="text-foreground">What is a fiscal year?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            The federal fiscal year runs October 1 to September 30. FY2024 = Oct 1, 2023 to Sep 30, 2024. Budget cycles heavily influence when agencies spend — most spending happens in Q4 (July–September) as agencies exhaust their budgets before the year ends.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="set-asides">
          <AccordionTrigger className="text-foreground">Set-aside types explained</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">Small Business (SB)</td><td className="p-2">Meets SBA size standards for NAICS code</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">8(a)</td><td className="p-2">Socially & economically disadvantaged, SBA-certified</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">WOSB</td><td className="p-2">Women-Owned Small Business, 51%+ owned by women</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">HUBZone</td><td className="p-2">Located in Historically Underutilized Business Zone</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">SDVOSB</td><td className="p-2">Service-Disabled Veteran-Owned Small Business</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2 font-medium">VOSB</td><td className="p-2">Veteran-Owned Small Business</td></tr>
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pro-tips">
          <AccordionTrigger className="text-foreground">Pro tips for small businesses</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
            <p>• Target agencies in your sector with the highest spend</p>
            <p>• Look for contracts under $250K (simplified acquisition threshold)</p>
            <p>• Identify incumbents by searching current recipients</p>
            <p>• Check Q4 (Jul–Sep) for highest activity — agencies spend heavily to exhaust budgets</p>
            <p>• Use NAICS codes to find your exact market size</p>
            <p>• Partner with large primes as a subcontractor to gain past performance</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
);
