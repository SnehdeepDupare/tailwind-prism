import { ComparisonSection } from "@/components/comparison-section";
import { Features } from "@/components/features";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <div className="flex-1 pb-20">
      <Hero />

      <ComparisonSection />

      <Features />
    </div>
  );
}
