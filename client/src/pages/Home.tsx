import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Zap,
  Check,
  Shield,
  TrendingUp,
  Video,
  Users,
  Eye,
  Calendar,
  Sparkles,
  Rocket,
  Quote,
  ArrowUpRight,
  Mail,
  X,
  Play,
  Heart,
  DollarSign,
  Target,
  BarChart3,
  FileText,
  Lightbulb,
  Upload,
  ThumbsUp,
  MessageCircle,
  Share2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook, SiTelegram, SiWhatsapp } from "react-icons/si";
import heroImage from "@assets/generated_images/Content_creation_workspace_montage_8cb5e36f.png";

// Pricing tiers
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
    popular: false
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
      "Advanced content strategy & ideation",
      "Premium editing with viral hooks",
      "Multi-variation testing",
      "Weekly analytics reviews",
      "Bi-weekly strategy calls",
      "24/7 live support from the CEO",
      "Algorithm optimization"
    ],
    cta: "Dominate Your Niche",
    popular: true
  },
  {
    name: "Empire Tier",
    price: "$13,475",
    period: "/month",
    clips: "2,500",
    accounts: "27",
    uploads: "10,000",
    description: "For creators who want total market saturation",
    features: [
      "250 original clips × 10 variations = 2,500 total clips",
      "27 branded sub-accounts (108 total profiles)",
      "Posted across Instagram, TikTok, YouTube, Facebook",
      "Complete content ecosystem",
      "Elite-level editing & optimization",
      "Full A/B testing & iteration",
      "Real-time analytics dashboard",
      "Weekly strategy sessions",
      "Dedicated account manager",
      "24/7 live support from the CEO",
      "Custom brand positioning",
      "Comment & community management"
    ],
    cta: "Build Your Empire",
    popular: false
  }
];

// Client results
const clientResults = [
  {
    initials: "MC",
    role: "Fitness Influencer",
    result: "10M+ monthly views",
    quote: "I went from posting 20 videos a month to having 2,000 uploads across all platforms. The algorithm treats each account separately—it's like I have 20 channels all growing at once.",
    metrics: [
      { label: "Monthly Views", value: "10M+" },
      { label: "Total Engagement", value: "377K+" },
      { label: "Growth Rate", value: "400%" }
    ]
  },
  {
    initials: "JD",
    role: "Content Creator & Coach",
    result: "140K+ new followers in 90 days",
    quote: "This system changed everything. I film once a week and they handle the rest. My reach went from thousands to millions, and my revenue grew 5x from all the inbound leads.",
    metrics: [
      { label: "New Followers", value: "140K+" },
      { label: "Revenue Growth", value: "5x" },
      { label: "Inbound Leads", value: "850/mo" }
    ]
  },
  {
    initials: "B",
    role: "YouTube Creator",
    result: "300K+ views from one video",
    quote: "Took me from 100 subscribers to 2,400+ with one viral video that hit 300K views. The editing and strategy completely transformed my channel's trajectory.",
    metrics: [
      { label: "Subscribers Gained", value: "2,300+" },
      { label: "Best Video", value: "300K views" },
      { label: "Time to Viral", value: "14 days" }
    ]
  }
];

// FAQ
const faqs = [
  {
    question: "How is this different from hiring a video editor?",
    answer: "A video editor makes videos. We build a content machine. You get 10-27 branded accounts, 500-2,500 clips monthly, multi-platform distribution, and complete management. It's the difference between getting a few videos and having an entire content empire running on autopilot."
  },
  {
    question: "Do I need to create new content or can I use existing videos?",
    answer: "Both work. You can film fresh long-form content, send us stream recordings, or give us your existing video library. We'll extract every usable moment and turn it into hundreds of optimized clips. Most clients film one 60-minute video monthly and we generate 500-2,500 clips from it."
  },
  {
    question: "What if I don't know what to talk about when filming?",
    answer: "We handle that. After you fill out our onboarding form about your niche, offer, and audience, we'll give you a complete filming guide: topics, questions to answer, talking points, and storylines—all optimized for viral clip potential. You'll know exactly what to say before you hit record."
  },
  {
    question: "How many accounts will I have and on which platforms?",
    answer: "Growth Tier: 10 accounts. Domination: 15 accounts. Empire: 27 accounts. Each account is created on Instagram, TikTok, YouTube, and Facebook. That's 40-108 total profiles. Every account gets custom branding, unique bios, and platform-specific optimization."
  },
  {
    question: "How many clips and uploads per month?",
    answer: "Growth: 500 clips = 2,000 monthly uploads (500 × 4 platforms). Domination: 1,000 clips = 4,000 uploads. Empire: 2,500 clips = 10,000 uploads. For comparison, most creators post 20-30 videos monthly. We're posting 67-333x more content."
  },
  {
    question: "How long until I see results?",
    answer: "Most clients hit 1-2M views in the first 30 days. Why? Because we're flooding the algorithm with hundreds of clips daily across multiple accounts. Follower growth starts immediately. By month 2-3, you'll see measurable business impact: more authority, more recognition, more inbound leads."
  },
  {
    question: "Who owns the accounts and content?",
    answer: "You own everything. The accounts are created for you, the content is yours, and you control it all. We're your service provider managing the system. You can take over the accounts, pause service, or export everything at any time."
  },
  {
    question: "Can I make changes or request different editing styles?",
    answer: "Yes. Growth tier gets monthly reviews to adjust strategy. Domination gets weekly analytics + bi-weekly calls to fine-tune everything. Empire tier gets real-time access, weekly strategy sessions, and a dedicated manager who optimizes constantly based on what's working."
  },
  {
    question: "What happens if a video doesn't perform well?",
    answer: "That's why volume matters. Out of 500-2,500 clips monthly, some will hit, some won't. But we're constantly testing: different hooks, captions, thumbnails, posting times. The sheer volume guarantees winners. Plus, we analyze what works and double down on those patterns."
  },
  {
    question: "Do you help with my sales funnel or converting viewers to customers?",
    answer: "We focus on content creation, distribution, and account management. Your CTAs, landing pages, and sales process are up to you. But here's the thing: with millions of views and massive follower growth, converting traffic becomes significantly easier."
  },
  {
    question: "Can I start small and upgrade later?",
    answer: "Absolutely. Most clients start with Growth Tier ($4,000/month) to test the system. Once they see the first month's results—views exploding, followers growing, leads coming in—they upgrade to Domination or Empire. You can scale up or down based on your goals and budget."
  },
  {
    question: "What if I'm in a competitive niche?",
    answer: "Perfect. Competitive niches are where this system dominates. While your competitors post 20-30 videos monthly on one account, you're posting 2,000-10,000 across 40-108 accounts. You become unavoidable. People will see you everywhere and assume you're the biggest authority in the space."
  }
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold">
      {count}
      {suffix}
    </div>
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10"
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [showCalendly, setShowCalendly] = useState(false);

  const scrollToBooking = () => {
    const element = document.getElementById("booking");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/85 to-secondary/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="font-bold text-2xl text-white" data-testid="navbar-brand">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kaba</span><span className="text-white">Content</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button 
              size="sm"
              variant="ghost"
              className="text-white hover:text-primary"
              onClick={scrollToBooking}
              data-testid="navbar-book-call"
            >
              Book Your Strategy Call
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              className="text-white hover:text-primary"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="navbar-how-it-works"
            >
              See How It Works
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              className="text-white hover:text-primary"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="navbar-pricing"
            >
              Pricing
            </Button>
          </div>
        </div>
      </nav>
      {/* Hero Section - The Big Promise */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary/85 to-secondary pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-secondary" />
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 md:py-32 w-full">
          <ScrollReveal>
            <div className="max-w-4xl">
              <div className="inline-block px-4 py-2 bg-white/60 border border-primary/50 rounded-full text-black-100 text-sm font-semibold mb-6">
                The Mass-Content System for Creators, Coaches & Gurus
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Get 2 Million+ Views<br />Every Single Month
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                We turn one long-form video into 500-2,500 clips, post them across 10-27 branded sub accounts, and flood the algorithm so you become unavoidable in your niche.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  onClick={scrollToBooking}
                  className="bg-primary hover:bg-primary/90 text-white text-lg font-semibold px-8 py-6"
                  data-testid="button-hero-cta"
                >
                  <Calendar className="w-6 h-6 mr-2" />
                  Book Your Strategy Call
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg font-semibold px-8 py-6"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-see-how"
                >
                  See How It Works
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg font-semibold px-8 py-6"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-pricing"
                >
                  <DollarSign className="w-6 h-6 mr-2" />
                  Pricing
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center md:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">2,500</div>
                  <div className="text-sm text-white/70">Clips per month (max)</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">10,000</div>
                  <div className="text-sm text-white/70">Monthly uploads (max)</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">27</div>
                  <div className="text-sm text-white/70">Branded accounts (max)</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">1-2M</div>
                  <div className="text-sm text-white/70">Views monthly (typical)</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* The Dream/Vision - Paint the Picture */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Imagine This...</h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                You wake up to millions of new views. Your phone is full of notifications. People recognize you everywhere on social media. Inbound leads are flooding in. You've become the undisputed authority in your niche.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <ScrollReveal delay={100}>
              <Card className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Millions of Views</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    2 million+ views every single month. Your content is everywhere. The algorithm loves you because you're feeding it exactly what it wants: volume, consistency, and variations.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Unstoppable Authority</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    People see you on Instagram, TikTok, YouTube, and Facebook—constantly. You become the face of your niche. Competitors can't keep up. Clients assume you're the biggest name in the industry.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <Card className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Explosive Business Growth</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    More followers, more leads, more sales. Your inbox is full of opportunities. Your offers sell out. You've built a content machine that works 24/7 while you focus on serving clients and scaling revenue.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold mb-4">
                This isn't a fantasy. This is what happens when you post 2,000-10,000 times per month instead of 20.
              </p>
              <p className="text-lg text-muted-foreground">
                And you only have to film once.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* Evidence/Results - Social Proof */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Clients Are Getting These Results</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Real numbers from real clients using the mass-content system
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {clientResults.map((result, index) => (
              <ScrollReveal key={result.initials} delay={index * 100}>
                <Card className="h-full border-2" data-testid={`card-result-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {result.initials}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{result.role}</div>
                        <div className="text-sm text-primary font-semibold">{result.result}</div>
                      </div>
                    </div>
                    <Quote className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">"{result.quote}"</p>
                    <div className="space-y-3 pt-6 border-t">
                      {result.metrics.map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                          <span className="font-bold text-primary text-lg">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      {/* The Problem - Why Normal Approach Fails */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Here's Why You're Not Getting Results</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Most creators are playing a losing game. They post on one account, upload 20-30 videos monthly, and wonder why growth is slow.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="max-w-5xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2">
                          <th className="p-6 text-left font-bold">Metric</th>
                          <th className="p-6 text-center font-bold text-muted-foreground">Traditional Approach</th>
                          <th className="p-6 text-center font-bold text-primary">Our System</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-6 font-semibold">Accounts Created</td>
                          <td className="p-6 text-center text-muted-foreground">1 account</td>
                          <td className="p-6 text-center text-primary font-bold">10-27 accounts</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-6 font-semibold">Monthly Uploads</td>
                          <td className="p-6 text-center text-muted-foreground">20-30 videos</td>
                          <td className="p-6 text-center text-primary font-bold">2,000-10,000 videos</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-6 font-semibold">Platform Reach</td>
                          <td className="p-6 text-center text-muted-foreground">Usually 1-2 platforms</td>
                          <td className="p-6 text-center text-primary font-bold">4 platforms simultaneously</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-6 font-semibold">Algorithm Advantage</td>
                          <td className="p-6 text-center text-muted-foreground">Low (competing with millions)</td>
                          <td className="p-6 text-center text-primary font-bold">High (flooding the algorithm)</td>
                        </tr>
                        <tr>
                          <td className="p-6 font-semibold">Typical Monthly Views</td>
                          <td className="p-6 text-center text-muted-foreground">10K-100K</td>
                          <td className="p-6 text-center text-primary font-bold text-xl">1-2 Million+</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 p-6 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-destructive">The Truth About Single-Account Growth</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Posting 20-30 videos monthly on one account means you're competing with millions of other creators for limited algorithm visibility. Even with great content, you'll struggle to break through. The math simply doesn't work in your favor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* The Solution - Overview */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">The Solution: The Mass-Content System</h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                We build you a content empire. Multiple branded accounts. Hundreds of clips monthly. Full automation. Complete management.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <ScrollReveal delay={100}>
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-5xl font-bold mb-2">67-333x</div>
                <div className="text-sm text-white/80">More content than competitors</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-5xl font-bold mb-2">4</div>
                <div className="text-sm text-white/80">Platforms simultaneously</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-5xl font-bold mb-2">108</div>
                <div className="text-sm text-white/80">Max profiles created (Empire)</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-5xl font-bold mb-2">100%</div>
                <div className="text-sm text-white/80">Managed for you</div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      {/* How It Works - Presentation Walkthrough */}
      <section id="how-it-works" className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold mb-4">
                The Complete Process
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">How The System Works</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Let me walk you through exactly what happens from the moment you sign up to the moment you're getting millions of views
              </p>
            </div>
          </ScrollReveal>

          {/* Step 1 */}
          <ScrollReveal delay={100}>
            <Card className="mb-8 border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 1: We Study Your Brand & Niche</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      First, you fill out our onboarding form. We learn everything about you: your niche, your offer, your personality, your target audience, your competitors, and your goals.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Fill out a simple form about your business, audience, and content goals</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Analyze your niche, research your competitors, and create a complete content strategy tailored to your brand</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Step 2 */}
          <ScrollReveal delay={200}>
            <Card className="mb-8 border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 2: We Build Your Account Network</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      We create 10-27 branded sub-accounts (depending on your tier) across Instagram, TikTok, YouTube, and Facebook. Each account gets custom branding, unique bios, specific positioning, and its own visual identity.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
                        <SiInstagram className="w-10 h-10 mx-auto mb-2 text-pink-500" />
                        <div className="font-bold text-sm">Instagram</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-black/10 to-cyan-500/10 rounded-xl border border-cyan-500/20">
                        <SiTiktok className="w-10 h-10 mx-auto mb-2" />
                        <div className="font-bold text-sm">TikTok</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20">
                        <SiYoutube className="w-10 h-10 mx-auto mb-2 text-red-500" />
                        <div className="font-bold text-sm">YouTube</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                        <SiFacebook className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                        <div className="font-bold text-sm">Facebook</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Nothing. We handle everything.</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Create 40-108 total profiles with unique branding, write all bios, set up posting infrastructure, optimize each for their platform</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Step 3 */}
          <ScrollReveal delay={300}>
            <Card className="mb-8 border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 3: You Film Once</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      We give you a complete filming guide: topics, questions, talking points, storylines—all optimized for viral clip potential. You film one 60-90 minute video (or send us an existing video, stream recording, or podcast).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Film one piece of long-form content. Or give us existing videos. That's it.</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Provide
                        </h4>
                        <p className="text-sm text-muted-foreground">Complete filming guide with proven topics, questions to answer, and talking points designed to generate maximum clip potential</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Step 4 */}
          <ScrollReveal delay={400}>
            <Card className="mb-8 border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 4: We Extract Every Usable Clip</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      Our team watches your video and extracts every single viral moment, valuable teaching point, quotable line, and engaging story. We identify 50-250 original clips depending on your tier (Growth: 50 clips, Domination: 100 clips, Empire: 250 clips).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Nothing. You're done filming.</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Watch every second, identify 50-250 viral moments, extract the original clips, categorize by topic, and prepare each for multi-variation editing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Step 5 */}
          <ScrollReveal delay={500}>
            <Card className="mb-8 border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 5: We Create 10 Unique Variations of Each Clip</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      Here's where the magic happens: we take each of those 50-250 original clips and edit them 10 different ways. So 50 clips × 10 variations = 500 total clips. 100 clips × 10 = 1,000. 250 clips × 10 = 2,500. Every variation gets unique branding, different hooks, custom captions, platform-specific optimization, and viral editing techniques.
                    </p>
                    <div className="mb-6 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl">
                      <h4 className="font-bold mb-4">What Goes Into Each Variation:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Custom branding elements</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Viral hook restructuring</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Platform-specific formatting</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Unique captions & subtitles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Attention retention edits</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>CTA placement</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Still nothing. We handle all editing.</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Create 10 unique variations of each original clip with different branding, hooks, captions, and optimization—turning 50-250 clips into 500-2,500 ready-to-post videos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Step 6 */}
          <ScrollReveal delay={600}>
            <Card className="mb-8 border-2 border-primary shadow-xl">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    6
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Step 6: We Schedule, Post & Manage Everything</h3>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      All 2,000-10,000 videos are scheduled and posted across all accounts, all platforms, every single day. We write custom captions, add hashtags, optimize posting times, and manage the entire content calendar. You never touch an account.
                    </p>
                    <div className="mb-6 p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-xl">
                      <h4 className="font-bold mb-4 text-xl">Then You Watch The Results Roll In:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">2M+</div>
                          <div className="text-sm text-muted-foreground">Views per month</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">Thousands</div>
                          <div className="text-sm text-muted-foreground">New followers weekly</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">Hundreds</div>
                          <div className="text-sm text-muted-foreground">Inbound leads monthly</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-6">
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What You Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Focus on serving clients, closing deals, and growing your business. The content machine runs itself.</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          What We Do
                        </h4>
                        <p className="text-sm text-muted-foreground">Schedule all videos, write captions, manage all accounts, optimize posting times, monitor performance, provide analytics, adjust strategy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={700}>
            <div className="text-center mt-12 p-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border-2 border-primary/20">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                That's The Entire System
              </h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                You film once. We turn it into 500-2,500 clips. We post 2,000-10,000 times across 40-108 accounts. You get 2M+ views monthly and become the dominant authority in your niche.
              </p>
              <Button size="lg" onClick={scrollToBooking} data-testid="button-how-it-works-cta">
                <Calendar className="w-5 h-5 mr-2" />
                Book Your Strategy Call
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Growth Tier</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                All tiers include the complete system: account creation, content extraction, editing, posting, and management
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <ScrollReveal key={tier.name} delay={index * 100}>
                <Card 
                  className={`h-full flex flex-col relative border-2 ${
                    tier.popular 
                      ? 'border-primary shadow-2xl lg:scale-105' 
                      : ''
                  }`}
                  data-testid={`card-pricing-${index}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-full flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-3">{tier.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      <div className="space-y-2 mb-4 p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Clips per month:</span>
                          <span className="text-lg font-bold text-primary">{tier.clips}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Sub-accounts:</span>
                          <span className="text-lg font-bold text-primary">{tier.accounts}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Total uploads/month:</span>
                          <span className="text-lg font-bold text-primary">{tier.uploads}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    <div className="space-y-3 flex-1 mb-6">
                      {tier.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex} 
                          className="flex items-start gap-3"
                          data-testid={`feature-${index}-${featureIndex}`}
                        >
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="lg"
                      variant={tier.popular ? "default" : "outline"}
                      className="w-full"
                      onClick={scrollToBooking}
                      data-testid={`button-pricing-${index}`}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="mt-12 text-center p-8 bg-white dark:bg-slate-950 rounded-2xl border-2">
              <h3 className="text-2xl font-bold mb-6">Not sure which tier is right for you?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Book a free strategy call. We'll analyze your niche, discuss your goals, and recommend the best plan for maximum ROI.
              </p>
              <Button size="lg" onClick={scrollToBooking}>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Free Strategy Call
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Common Questions</h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Everything you need to know about the mass-content system
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <Accordion type="single" collapsible className="space-y-4" data-testid="accordion-faq">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background border-2 rounded-xl px-6 py-2"
                  data-testid={`faq-item-${index}`}
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>
      {/* Final CTA */}
      <section id="booking" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Ready to Dominate Your Niche?</h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4">
                Book a free 30-minute strategy call. We'll walk you through the system, show you how it works for your specific niche, and help you choose the right tier.
              </p>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                No pressure. No hard sell. Just a clear explanation of how we can help you get 1-2M views monthly and become the undisputed authority in your space.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="max-w-4xl mx-auto">
              {!showCalendly ? (
                <div className="text-center">
                  <Button 
                    size="lg"
                    onClick={() => setShowCalendly(true)}
                    className="bg-white text-primary hover:bg-white/90 shadow-2xl text-xl font-semibold px-12 py-8"
                    data-testid="button-show-calendly"
                  >
                    <Calendar className="w-7 h-7 mr-3" />
                    Book Your Free Strategy Call
                  </Button>
                  <p className="mt-8 text-white/80 text-lg">
                    Or message us on Telegram: <a href="https://t.me/arminkaba" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-white">@arminkaba</a>
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src="https://calendly.com/arminabadi7/30min"
                    width="100%"
                    height="700"
                    frameBorder="0"
                    data-testid="calendly-widget"
                    className="rounded-2xl"
                  />
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-16 pt-12 border-t border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <SiTelegram className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-semibold mb-2">Telegram</div>
                  <a href="https://t.me/arminkaba" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-lg">@arminkaba</a>
                </div>
                <div>
                  <SiWhatsapp className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-semibold mb-2">WhatsApp</div>
                  <a href="https://wa.me/16045054851" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-lg">Chat Now</a>
                </div>
                <div>
                  <Mail className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-semibold mb-2">Email</div>
                  <a href="mailto:arminabadi7@gmail.com" className="text-white/80 hover:text-white">arminabadi7@gmail.com</a>
                </div>
                <div>
                  <SiInstagram className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-semibold mb-2">Instagram</div>
                  <a href="https://instagram.com/kabacontent" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white">@kabacontent</a>
                </div>
              </div>
            </div>
          </ScrollReveal>
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
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#booking" className="hover:text-white">Book a Call</a></li>
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
