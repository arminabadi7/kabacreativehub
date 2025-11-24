import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Check,
  Calendar,
  Mail,
  DollarSign
} from "lucide-react";
import { SiInstagram, SiTelegram, SiWhatsapp } from "react-icons/si";

const pricingTiers = [
  {
    name: "Growth Tier",
    price: "$4,000",
    period: "/month",
    clips: "500",
    accounts: "10",
    uploads: "2,000",
    description: "Start flooding the algorithm with your content",
    features: [
      "50 original clips × 10 variations = 500 total clips",
      "10 branded sub-accounts (40 total profiles)",
      "Posted across Instagram, TikTok, YouTube, Facebook",
      "Content ideation & filming guide",
      "Full editing & viral optimization",
      "Automated daily posting",
      "Monthly performance reports",
      "24/7 live support from the CEO"
    ],
    cta: "Start Growing",
    popular: false,
    commission: "$1,000"
  },
  {
    name: "Domination Tier",
    price: "$7,000",
    period: "/month",
    clips: "1,000",
    accounts: "15",
    uploads: "4,000",
    description: "Recommended for aggressive niche domination",
    features: [
      "100 original clips × 10 variations = 1,000 total clips",
      "15 branded sub-accounts (60 total profiles)",
      "Posted across Instagram, TikTok, YouTube, Facebook",
      "Content ideation & filming guide",
      "Full editing & viral optimization",
      "Automated daily posting",
      "Monthly performance reports",
      "24/7 live support from the CEO"
    ],
    cta: "Start Dominating",
    popular: true,
    commission: "$1,750"
  },
  {
    name: "Empire Tier",
    price: "$13,475",
    period: "/month",
    clips: "2,500",
    accounts: "27",
    uploads: "10,000",
    description: "Maximum scale. Maximum results. Total authority.",
    features: [
      "250 original clips × 10 variations = 2,500 total clips",
      "27 branded sub-accounts (108 total profiles)",
      "Posted across Instagram, TikTok, YouTube, Facebook",
      "Content ideation & filming guide",
      "Full editing & viral optimization",
      "Automated daily posting",
      "Monthly performance reports",
      "24/7 live support from the CEO"
    ],
    cta: "Build Your Empire",
    popular: false,
    commission: "$3,368.75"
  }
];

export default function Affiliate() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/85 to-secondary/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-start gap-12">
          <Link href="/">
            <button className="font-bold text-2xl flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Kaba</span><span className="text-white">Content</span>
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary/85 to-secondary pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-secondary" />
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <Link href="/">
            <button className="mb-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">Affiliate Program</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Earn 25% commission on every referral you send to Kaba Content. Promote the mass-content system and get paid recurring commissions for each client you bring in.
            </p>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <p className="text-white/80 text-lg mb-2">Your Commission Rate</p>
                <p className="text-5xl font-bold text-white">25%</p>
                <p className="text-white/70 mt-2">Of every monthly subscription your referral pays</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">Share Your Link</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get your unique referral link and share it with your audience, network, or community. You can share it via email, social media, or anywhere your audience hangs out.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">They Sign Up</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When someone clicks your link and signs up for any of our pricing tiers, they become your referral. We track everything automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">Earn 25% Commission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every month they stay subscribed, you earn 25% of their subscription fee. Recurring commissions, recurring income.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Tiers & Commissions */}
      <section id="pricing" className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Pricing Tiers & Commission Rates</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here's exactly how much you'll earn per referral
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="relative">
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <Card className={`h-full border-2 ${tier.popular ? "border-primary shadow-xl scale-105" : ""}`}>
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                      <p className="text-muted-foreground text-sm">{tier.description}</p>
                    </div>

                    <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/20 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Your Commission Per Referral</p>
                      <p className="text-3xl font-bold text-primary">{tier.commission}</p>
                      <p className="text-xs text-muted-foreground mt-2">25% of {tier.price}{tier.period}</p>
                    </div>

                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold">Client Plans Get:</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original Clips</span>
                            <span className="font-semibold">{tier.clips}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Uploads</span>
                            <span className="font-semibold">{tier.uploads}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Branded Accounts</span>
                            <span className="font-semibold">{tier.accounts}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                    >
                      Promote {tier.name}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Affiliate FAQ</h2>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">How do I get started?</h3>
                <p className="text-muted-foreground">
                  Contact us on Telegram (@arminkaba) or email (arminabadi7@gmail.com) and let us know you want to join the affiliate program. We'll send you your unique referral link and all the resources you need to promote.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">How long do I earn commissions?</h3>
                <p className="text-muted-foreground">
                  As long as your referral stays subscribed, you earn 25% of their monthly subscription. If they cancel, commissions stop. If they re-subscribe later, you earn commissions again.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">How do I track my referrals?</h3>
                <p className="text-muted-foreground">
                  You'll get a dashboard where you can see all your referrals, active subscriptions, and commissions earned. We update it monthly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">When do I get paid?</h3>
                <p className="text-muted-foreground">
                  Commissions are paid monthly via bank transfer or payment method of your choice. Minimum payout is $50. We process payments within 7 days of the end of the month.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">Is there a referral cap?</h3>
                <p className="text-muted-foreground">
                  No. There's no limit to how many clients you can refer or how much you can earn. Some of our top affiliates earn $10,000+ per month.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">Can I promote alongside other businesses?</h3>
                <p className="text-muted-foreground">
                  Yes. You can promote Kaba Content while running your own business. Just make sure you're not promoting direct competitors (other mass-content systems).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-white/90 mb-12">
            Join our affiliate program and earn recurring commissions on every referral
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 text-lg font-semibold px-8 py-6"
              asChild
            >
              <a href="https://t.me/arminkaba" target="_blank" rel="noopener noreferrer">
                <SiTelegram className="w-5 h-5 mr-2" />
                Message on Telegram
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg font-semibold px-8 py-6"
              asChild
            >
              <a href="mailto:arminabadi7@gmail.com">
                <Mail className="w-5 h-5 mr-2" />
                Email Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4">Kaba Content</h3>
              <p className="text-sm text-white/60 leading-relaxed">The mass-content system for creators, coaches, and gurus who want to dominate their niche.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/">Home</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><a href="https://t.me/arminkaba" target="_blank" rel="noopener noreferrer" className="hover:text-white">Book a Call</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="https://t.me/arminkaba" target="_blank" rel="noopener noreferrer" className="hover:text-white">Telegram: @arminkaba</a></li>
                <li><a href="https://wa.me/16045054851" target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp Chat</a></li>
                <li><a href="mailto:arminabadi7@gmail.com" className="hover:text-white">arminabadi7@gmail.com</a></li>
                <li><a href="https://instagram.com/kabacontent" target="_blank" rel="noopener noreferrer" className="hover:text-white">@kabacontent</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Domain</h4>
              <p className="text-sm text-white/60">kabacontent.com</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
            <p>&copy; 2025 Kaba Content. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
