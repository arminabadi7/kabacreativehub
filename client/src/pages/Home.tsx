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
  Phone,
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
  Share2
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import heroImage from "@assets/generated_images/Content_creation_workspace_montage_8cb5e36f.png";

// System offerings - the three tiers for mass content
const pricingTiers = [
  {
    name: "Growth Tier",
    price: "$4,000",
    period: "/month",
    clips: "500+",
    accounts: "10 accounts",
    description: "Perfect for creators starting their mass-content journey",
    features: [
      "500+ edited clips per month",
      "10 branded sub-accounts created",
      "4 platform distribution (IG, TikTok, YT, FB)",
      "Content ideation form & strategy",
      "Full editing & optimization",
      "Scheduled posting across all accounts",
      "Monthly performance review",
      "Email support"
    ],
    cta: "Start Explosive Growth",
    popular: false
  },
  {
    name: "Domination Tier",
    price: "$7,000",
    period: "/month",
    clips: "1000+",
    accounts: "15 accounts",
    description: "Dominate your niche with aggressive scaling",
    features: [
      "1000+ edited clips per month",
      "15 branded sub-accounts created",
      "4 platform distribution (IG, TikTok, YT, FB)",
      "Premium content ideation & research",
      "Advanced editing with viral hooks",
      "Strategic posting optimization",
      "Weekly analytics & growth reviews",
      "Bi-weekly strategy calls",
      "Priority support",
      "Algorithm insights & adjustments"
    ],
    cta: "Scale to Millions",
    popular: true
  },
  {
    name: "Empire Tier",
    price: "$13,475",
    period: "/month",
    clips: "2500+",
    accounts: "27 accounts",
    description: "Complete content domination across all platforms",
    features: [
      "2500+ edited clips per month",
      "27 fully branded sub-accounts",
      "4 platform distribution (IG, TikTok, YT, FB)",
      "Complete ecosystem management",
      "Premium content strategy & ideation",
      "All variations fully optimized",
      "Daily posting automation",
      "Real-time analytics dashboard",
      "Weekly strategy sessions",
      "Dedicated account manager",
      "A/B testing & optimization",
      "Custom branding & positioning",
      "Comment management",
      "White-glove service"
    ],
    cta: "Build Your Empire",
    popular: false
  }
];

// How it works - the 6-step process
const processSteps = [
  {
    step: "1",
    title: "Fill the Onboarding Form",
    description: "Tell us about your niche, offer, personality, and goals. We gather everything needed to position your brand correctly.",
    icon: FileText
  },
  {
    step: "2",
    title: "We Create Your Branded Accounts",
    description: "10-27 custom sub-accounts created across Instagram, TikTok, YouTube, and Facebook with unique branding and positioning.",
    icon: Target
  },
  {
    step: "3",
    title: "You Film Once",
    description: "Send us a long-form video, stream recording, or existing content. One piece of content is all you need.",
    icon: Video
  },
  {
    step: "4",
    title: "We Create Hundreds of Variations",
    description: "Extract clips, create 500-2500 variations, match each to account branding, optimize for hooks, captions, and retention.",
    icon: Sparkles
  },
  {
    step: "5",
    title: "Automated Posting & Management",
    description: "All videos scheduled and posted daily across all accounts. We handle captions, hashtags, CTAs, and optimal timing.",
    icon: Upload
  },
  {
    step: "6",
    title: "Watch Your Growth Explode",
    description: "1-2M+ views monthly, massive follower growth, authority building, and inbound leads flowing in automatically.",
    icon: Rocket
  }
];

// What makes it work - the core benefits
const coreSystem = [
  {
    icon: Eye,
    title: "More Accounts = More Reach",
    description: "10-27 accounts flooding the algorithm = millions more eyeballs on your content"
  },
  {
    icon: Zap,
    title: "More Variations = More Viral",
    description: "Each clip edited 10-27 different ways = exponentially higher chance of viral hits"
  },
  {
    icon: TrendingUp,
    title: "More Volume = Domination",
    description: "500-2500 clips monthly vs. competitors' 20-30 = you win by pure volume"
  },
  {
    icon: Users,
    title: "More Consistency = Authority",
    description: "Posting daily across all platforms builds instant credibility and recognition"
  }
];

// Results/testimonials showing the outcome
const clientResults = [
  {
    name: "E-Commerce Owner",
    initials: "EK",
    result: "1.2M views in first month",
    testimonial: "Went from 12K followers to 95K in 90 days. The sub-account system completely changed our reach.",
    metrics: [
      { label: "Views", value: "1.2M" },
      { label: "Followers", value: "95K" }
    ]
  },
  {
    name: "Fitness Influencer",
    initials: "MC",
    result: "2.8M+ views consistently",
    testimonial: "The algorithm treats our 20+ accounts as separate entities. It's like having 20 channels growing simultaneously.",
    metrics: [
      { label: "Monthly Views", value: "2.8M+" },
      { label: "Engagement", value: "14.3%" }
    ]
  },
  {
    name: "Coaching Business",
    initials: "JD",
    result: "850K+ leads generated",
    testimonial: "The volume of content is insane. People see us everywhere. Our inbound inquiries went through the roof.",
    metrics: [
      { label: "Leads/Month", value: "850K+" },
      { label: "Revenue Growth", value: "5x" }
    ]
  }
];

// FAQ data
const faqs = [
  {
    question: "How is this different from regular content creation services?",
    answer: "Traditional services create content slowly. We use a mass-content system: one long-form video becomes 500-2500 clips posted across 10-27 branded accounts. You get volume, reach, and frequency that competitors can't match. That's why our clients hit 1-2M views in their first month."
  },
  {
    question: "Do I need existing content to start?",
    answer: "No. You can film fresh content, send us a stream recording, or use existing videos from your archive. We'll extract and optimize everything. The key is giving us the raw material—we handle all the heavy lifting."
  },
  {
    question: "What if I'm not ready to film? Can you help with ideation?",
    answer: "Absolutely. Fill out our onboarding form with info about your niche, offer, and personality. We'll generate video topics, questions, talking points, and storylines optimized for viral clips. You'll have a complete roadmap before you film."
  },
  {
    question: "How many accounts will I have, and what platforms?",
    answer: "Depends on your tier. Growth (10 accounts), Domination (15), Empire (27). Each account is created on Instagram, TikTok, YouTube, and Facebook = 40-108 total profiles. Every account has custom branding, unique bios, and posting strategy."
  },
  {
    question: "How many clips do I get per month?",
    answer: "Growth Tier: 500+ clips. Domination: 1000+. Empire: 2500+. All clips are fully edited, optimized, and scheduled. That's 2000-10,000 total uploads monthly across all platforms."
  },
  {
    question: "What if I need revisions or want to change the strategy?",
    answer: "Growth tier gets monthly reviews. Domination gets weekly reviews + bi-weekly calls. Empire gets real-time dashboard access + weekly strategy sessions + dedicated manager. We adjust content, posting times, and strategy based on what's working."
  },
  {
    question: "Who owns the accounts and content?",
    answer: "You own everything. The accounts are created in your name, on your behalf. All content is yours. We simply manage them as your service provider. You can take over or pause anytime."
  },
  {
    question: "How long until I see results?",
    answer: "Most clients see 1-2M views in their first 30 days purely from volume + multi-platform distribution. Follower growth starts immediately. By month 2-3, you'll have significant authority, more leads, and measurable business impact."
  },
  {
    question: "What if my niche is underperforming?",
    answer: "Volume fixes most issues. But we also analyze what's working in your content, adjust hooks, test different captions and thumbnails, and optimize posting times. Our Domination and Empire tiers include weekly and bi-weekly strategy calls to fine-tune everything."
  },
  {
    question: "Can you help with my sales funnel or offer?",
    answer: "We focus on content creation, distribution, and account management. Your CTAs, landing pages, and sales funnels are up to you. But with millions of views and followers we deliver, converting them becomes much easier."
  },
  {
    question: "What if I have a smaller budget or want to test first?",
    answer: "Start with Growth Tier at $4,000/month. You get 500+ clips, 10 accounts, and real results. Most clients upgrade after seeing the first month's impact. If growth isn't working, it's usually a content/positioning issue—not the system."
  },
  {
    question: "Do you handle comment management and community?",
    answer: "Growth and Domination tiers include basic analytics. Empire tier includes full comment management, community strategy, and engagement optimization. We can customize based on your needs."
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
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<number | null>(null);
  const [showCalendly, setShowCalendly] = useState(false);

  const scrollToBooking = () => {
    const element = document.getElementById("booking");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Content creation" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 md:py-32 w-full">
          <ScrollReveal>
            <div className="max-w-3xl mb-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Turn One Video Into 2,500+ Clips
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Post across 10-27 branded accounts. Hit 1-2M+ views monthly. Build your empire on autopilot.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={scrollToBooking}
                  className="bg-primary hover:bg-primary/90 text-white text-lg font-semibold"
                  data-testid="button-hero-cta"
                >
                  <Calendar className="w-6 h-6 mr-2" />
                  Book Strategy Call
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-see-pricing"
                >
                  See Pricing
                </Button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">2,500+</div>
                <div className="text-sm text-white/80">Clips/Month Max</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">2M+</div>
                <div className="text-sm text-white/80">Views Possible</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">27</div>
                <div className="text-sm text-white/80">Sub-Accounts Max</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">1</div>
                <div className="text-sm text-white/80">Video to Film</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why This System Destroys Competition</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Most creators post 20-30 videos monthly. We post 500-2,500 across 4 platforms. That's the difference between struggling and dominating.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreSystem.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 100}>
                <Card className="h-full border-2 hover-elevate" data-testid={`card-system-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* The Process - 6 Steps */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                From your first video to 2,000+ monthly uploads. Here's the complete process.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((process, index) => (
              <ScrollReveal key={process.step} delay={index * 100}>
                <Card className="h-full border-2" data-testid={`card-process-${index}`}>
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4 text-white font-bold text-lg">
                      {process.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{process.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{process.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Results Our Clients Get</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                These are real numbers from clients using the mass-content system
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clientResults.map((result, index) => (
              <ScrollReveal key={result.initials} delay={index * 100}>
                <Card className="h-full border-2" data-testid={`card-result-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {result.initials}
                      </div>
                      <div>
                        <div className="font-bold">{result.name}</div>
                        <div className="text-sm text-primary font-semibold">{result.result}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">"{result.testimonial}"</p>
                    <div className="space-y-3">
                      {result.metrics.map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-3 border-b">
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                          <span className="font-bold text-primary">{metric.value}</span>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Three Tiers of Growth</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
                Choose how aggressive your growth strategy should be
              </p>
              <p className="text-sm text-muted-foreground">
                All plans include content ideation, full editing, multi-platform distribution, and account management
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
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
                        Recommended
                      </div>
                    </div>
                  )}

                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="font-semibold text-primary">{tier.clips} clips monthly</div>
                        <div className="text-muted-foreground">{tier.accounts}</div>
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
            <div className="mt-12 p-8 bg-white dark:bg-slate-950 rounded-2xl border-2 border-primary/20">
              <h3 className="text-2xl font-bold text-center mb-6">The Math Behind The System</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Growth Tier</div>
                  <div className="text-3xl font-bold mb-2">2,000</div>
                  <div className="text-sm text-muted-foreground">Monthly uploads<br/>(500 clips × 4 platforms)</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Domination Tier</div>
                  <div className="text-3xl font-bold mb-2">4,000</div>
                  <div className="text-sm text-muted-foreground">Monthly uploads<br/>(1000 clips × 4 platforms)</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Empire Tier</div>
                  <div className="text-3xl font-bold mb-2">10,000</div>
                  <div className="text-sm text-muted-foreground">Monthly uploads<br/>(2500 clips × 4 platforms)</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
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

          <ScrollReveal delay={400}>
            <div className="mt-12 text-center p-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-3">Ready to Dominate Your Niche?</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Book a strategy call and let's discuss which tier is right for your growth goals
              </p>
              <Button size="lg" onClick={scrollToBooking} data-testid="button-faq-cta">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Your Free Call
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section with Calendly */}
      <section id="booking" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Let's Build Your Empire</h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                30-minute strategy call with our team. We'll show you exactly how the system works and which tier is right for you.
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
                    className="bg-white text-primary hover:bg-white/90 border-white shadow-2xl text-xl font-semibold"
                    data-testid="button-show-calendly"
                  >
                    <Calendar className="w-6 h-6 mr-2" />
                    Schedule Your Free Call
                  </Button>
                  <p className="mt-6 text-white/80">
                    Or contact us directly at <a href="tel:604-626-9278" className="underline font-semibold hover:text-white">604-626-9278</a>
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-2 shadow-2xl">
                  <div
                    className="calendly-inline-widget"
                    data-url="https://calendly.com"
                    style={{ minWidth: "320px", height: "700px" }}
                    data-testid="calendly-widget"
                  />
                  <p className="text-center text-muted-foreground text-sm mt-4 p-4">
                    Replace Calendly URL with your actual scheduling link
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-12 pt-12 border-t border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Phone className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold mb-1">Phone</div>
                  <a href="tel:604-626-9278" className="text-white/80 hover:text-white">604-626-9278</a>
                </div>
                <div>
                  <Mail className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold mb-1">Email</div>
                  <a href="mailto:arminabadi7@gmail.com" className="text-white/80 hover:text-white">arminabadi7@gmail.com</a>
                </div>
                <div>
                  <SiInstagram className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold mb-1">Instagram</div>
                  <a href="https://instagram.com/kabacontent" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white">@kabacontent</a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Kaba Content</h3>
              <p className="text-sm text-white/60">Mass-content system for creators, coaches, and gurus.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Our Results</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="tel:604-626-9278" className="hover:text-white">604-626-9278</a></li>
                <li><a href="mailto:arminabadi7@gmail.com" className="hover:text-white">Email</a></li>
                <li><a href="https://instagram.com/kabacontent" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Domain</h4>
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
