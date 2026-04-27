import LearnHub from "@/components/LearnHub";
import BrandHeader from "@/components/BrandHeader";

const LearnPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader
          title="Learn with Slipstream"
          subtitle="Quick guides to travel smarter"
        />
        <LearnHub />
      </div>
    </div>
  );
};

export default LearnPage;