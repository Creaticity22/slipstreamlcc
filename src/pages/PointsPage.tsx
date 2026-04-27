import PointsSummary from "@/components/PointsSummary";
import SponsoredRewardsRow from "@/components/SponsoredRewardsRow";
import BrandHeader from "@/components/BrandHeader";

const PointsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader
          title="Your points "
          subtitle="Keep riding green to level up!"
        />

        <PointsSummary />

        {/* Sponsored rewards marketplace — partner-powered rewards & badges */}
        <SponsoredRewardsRow placement="rewards" title="Rewards marketplace" />
      </div>
    </div>
  );
};

export default PointsPage;
