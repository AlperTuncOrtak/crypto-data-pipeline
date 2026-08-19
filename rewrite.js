const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Pricing.tsx', 'utf8');
const index = code.indexOf('export default function Pricing');
const prefix = code.substring(0, index);

const newCode = `import { PricingSection } from '../components/ui/pricing';

export default function Pricing({ onAuthOpen }: { onAuthOpen?: () => void }) {
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { plan: currentPlan, user } = useAuth();
  
  const handleSubscribe = async (planId: string, isMonthly: boolean) => {
    if (!user) {
      if (onAuthOpen) onAuthOpen();
      return;
    }
    try {
      setLoadingPlan(planId);
      const { data } = await apiClient.post('/stripe/create-checkout-session', {
        plan: planId,
        billing: isMonthly ? 'monthly' : 'yearly'
      });
      if (data && data.url) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Stripe error:', err);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const pricingPlans = PLANS.map((p) => ({
    name: p.id === 'free' ? 'Free' : p.id === 'pro' ? 'Pro' : 'Teams',
    price: p.price.monthly.toString(),
    yearlyPrice: p.price.yearly.toString(),
    period: 'month',
    features: p.features.filter(f => f.included).map(f => t(\`pricing.features.\${f.key}\`)),
    description: p.id === 'free' ? 'Essential crypto tracking' : p.id === 'pro' ? 'Advanced AI tools & unlimited access' : 'For professional teams',
    buttonText: currentPlan === p.id ? 'Current Plan' : loadingPlan === p.id ? 'Loading...' : p.price.monthly === 0 ? 'Get Started' : 'Subscribe',
    href: '#',
    isPopular: p.badge_key === 'most_popular',
    onClick: (isMonthly: boolean) => {
      if (currentPlan === p.id) return;
      if (p.price.monthly === 0) return; // Free plan
      handleSubscribe(p.id, isMonthly);
    }
  }));

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] overflow-x-hidden pt-24 pb-32">
      <PricingSection plans={pricingPlans} title="Find the Perfect Plan" description="Select the ideal package for your needs and start building today." />
    </div>
  );
}
`;

fs.writeFileSync('frontend/src/pages/Pricing.tsx', prefix + newCode);
