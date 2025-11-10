import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video, 
  FileText, 
  Lightbulb, 
  BarChart3, 
  Upload, 
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Sparkles,
  Target,
  Rocket,
  Quote,
  ArrowUpRight,
  Users,
  Eye,
  Heart,
  DollarSign,
  Play,
  X,
  ThumbsUp,
  MessageCircle,
  Share2
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import heroImage from "@assets/generated_images/Content_creation_workspace_montage_8cb5e36f.png";

const services = [
  {
    icon: Video,
    title: "Video Editing",
    description: "Professional editing that transforms raw footage into compelling content that captivates your audience."
  },
  {
    icon: FileText,
    title: "Scripting",
    description: "Engaging scripts crafted to tell your story and drive action from your viewers."
  },
  {
    icon: Lightbulb,
    title: "Video Ideation",
    description: "Creative concepts and strategies that set your content apart from the competition."
  },
  {
    icon: BarChart3,
    title: "Social Media Management",
    description: "Complete account management to grow your presence across all platforms."
  },
  {
    icon: Upload,
    title: "Content Distribution",
    description: "Upload 1000+ optimized clips to maximize your reach and engagement."
  },
  {
    icon: TrendingUp,
    title: "Analytics & Growth",
    description: "Data-driven insights to continuously improve performance and scale results."
  }
];

const stats = [
  { number: "1000+", label: "Clips Created", suffix: "" },
  { number: "50", label: "Million+ Views", suffix: "M+" },
  { number: "10+", label: "Happy Clients", suffix: "+" },
  { number: "24", label: "Hour Turnaround", suffix: "hr" }
];

const process = [
  {
    step: "1",
    title: "Book Your Call",
    description: "Schedule a free strategy session to discuss your goals and content needs.",
    icon: Calendar
  },
  {
    step: "2",
    title: "We Create",
    description: "Our team produces high-quality content tailored to your brand and audience.",
    icon: Sparkles
  },
  {
    step: "3",
    title: "You Grow",
    description: "Watch your views, followers, and revenue multiply with consistent content.",
    icon: Rocket
  }
];

const testimonials = [
  {
    quote: "Kaba Content transformed our social media presence. Within 3 months, we went from 10K to 150K followers and 5x'd our revenue. Their content strategy is unmatched.",
    author: "",
    role: "Content Creator & Coach",
    initials: "JD",
    metrics: [
      { icon: Users, value: "140K+", label: "New Followers" },
      { icon: DollarSign, value: "5x", label: "Revenue Growth" }
    ]
  },
  {
    quote: "Took me from 100 subscribers to 2,400+ with one video that did 300k+ views. The editing and strategy completely changed my channel's trajectory.",
    author: "",
    role: "YouTube Creator",
    initials: "B",
    metrics: [
      { icon: Eye, value: "300K+", label: "Views" },
      { icon: Users, value: "2,300+", label: "New Subscribers" }
    ]
  },
  {
    quote: "Best investment we made for our brand. The team at Kaba understands viral content and delivers results month after month. Our views went from thousands to millions.",
    author: "",
    role: "Fitness Influencer",
    initials: "MC",
    metrics: [
      { icon: Eye, value: "10M+", label: "Monthly Views" },
      { icon: Heart, value: "2.5M", label: "Total Engagement" }
    ]
  }
];

const caseStudies = [
  {
    industry: "E-Commerce",
    challenge: "Struggling to maintain consistent posting schedule while managing business operations",
    solution: "500+ optimized short-form videos distributed across TikTok, Instagram Reels, and YouTube Shorts",
    results: [
      "320% increase in website traffic",
      "4.8M total views in 90 days",
      "$250K in attributed revenue"
    ],
    timeframe: "3 Months"
  },
  {
    industry: "Coaching & Education",
    challenge: "Low engagement despite having quality content ideas",
    solution: "Professional scripting, editing, and strategic content distribution plan",
    results: [
      "From 12K to 180K followers",
      "85% average watch-through rate",
      "Sold out $10K coaching program"
    ],
    timeframe: "4 Months"
  },
  {
    industry: "Health & Fitness",
    challenge: "Needed to scale content production without sacrificing quality",
    solution: "End-to-end content creation from ideation to distribution with analytics tracking",
    results: [
      "15M+ views across platforms",
      "45K new email subscribers",
      "Launched successful supplement line"
    ],
    timeframe: "6 Months"
  }
];

const portfolioItems = [
  {
    id: 1,
    title: "Fitness Creator Transformation",
    category: "Health & Fitness",
    before: {
      views: "15K",
      engagement: "2.3%",
      followers: "8K"
    },
    after: {
      views: "2.4M",
      engagement: "12.8%",
      followers: "185K"
    },
    thumbnail: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    description: "Complete content overhaul with strategic editing and distribution strategy"
  },
  {
    id: 2,
    title: "E-Commerce Product Showcase",
    category: "E-Commerce",
    before: {
      views: "8K",
      engagement: "1.8%",
      followers: "12K"
    },
    after: {
      views: "1.2M",
      engagement: "9.4%",
      followers: "95K"
    },
    thumbnail: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    description: "High-converting product videos with professional editing and hook optimization"
  },
  {
    id: 3,
    title: "Personal Brand Growth",
    category: "Coaching",
    before: {
      views: "25K",
      engagement: "3.1%",
      followers: "18K"
    },
    after: {
      views: "5.8M",
      engagement: "15.2%",
      followers: "320K"
    },
    thumbnail: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    description: "Authority-building content series with viral hooks and storytelling techniques"
  },
  {
    id: 4,
    title: "Restaurant Social Strategy",
    category: "Food & Beverage",
    before: {
      views: "5K",
      engagement: "1.2%",
      followers: "6K"
    },
    after: {
      views: "980K",
      engagement: "11.5%",
      followers: "78K"
    },
    thumbnail: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    description: "Behind-the-scenes content and food showcase videos that drive foot traffic"
  },
  {
    id: 5,
    title: "Tech Review Channel",
    category: "Technology",
    before: {
      views: "12K",
      engagement: "2.5%",
      followers: "9K"
    },
    after: {
      views: "3.2M",
      engagement: "13.7%",
      followers: "210K"
    },
    thumbnail: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    description: "Professional product reviews with cinematic editing and clear value propositions"
  },
  {
    id: 6,
    title: "Fashion Influencer Rebrand",
    category: "Fashion & Lifestyle",
    before: {
      views: "20K",
      engagement: "2.8%",
      followers: "15K"
    },
    after: {
      views: "4.5M",
      engagement: "14.3%",
      followers: "280K"
    },
    thumbnail: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    description: "Cohesive content strategy with trend-forward editing and brand partnerships"
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
      { threshold: 0.1 }
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
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [showCalendly, setShowCalendly] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<number | null>(null);

  useEffect(() => {
    if (showCalendly) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showCalendly]);

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left text-white">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/20">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">1000+ Clips. 50M+ Views Generated.</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight">
                Scale Your Content.
                <br />
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Multiply Your Reach.
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed">
                Professional video editing, scripting, and content distribution services. 
                We create <span className="font-bold text-secondary">1000+ clips</span> to boost your views, followers, and sales.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button 
                  size="lg" 
                  onClick={scrollToBooking}
                  className="bg-white text-primary border-white shadow-2xl"
                  data-testid="button-book-call-hero"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book a Strategy Call
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-2 border-white/50 bg-white/10 backdrop-blur-md text-white"
                  data-testid="button-view-services"
                >
                  View Our Services
                </Button>
              </div>
            </ScrollReveal>
          </div>

          {/* Hero Image */}
          <ScrollReveal delay={400}>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Content creation workspace showing video editing and social media content" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
            </div>
          </ScrollReveal>
        </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mx-auto animate-pulse" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive content creation solutions to elevate your brand
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ScrollReveal key={service.title} delay={index * 100}>
                <Card className="h-full hover-elevate active-elevate-2 border-2" data-testid={`card-service-${index}`}>
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <service.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{service.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Results That Speak</h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <ScrollReveal key={stat.label} delay={index * 100}>
                <div className="text-center" data-testid={`stat-${index}`}>
                  {index === 1 ? (
                    <AnimatedCounter target={50} suffix="M+" />
                  ) : index === 0 ? (
                    <div className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold">1000+</div>
                  ) : index === 2 ? (
                    <AnimatedCounter target={10} suffix="+" />
                  ) : (
                    <div className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold">24hr</div>
                  )}
                  <p className="text-lg md:text-xl mt-4 text-white/80">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to transform your content strategy
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-20" />

            {process.map((item, index) => (
              <ScrollReveal key={item.step} delay={index * 150}>
                <div className="relative text-center" data-testid={`process-step-${index}`}>
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mb-6 shadow-lg mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse opacity-50" />
                    <item.icon className="w-12 h-12 text-white relative z-10" />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-mono text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 mt-4">{item.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">What Our Clients Say</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Real results from content creators and brands we've helped scale
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.initials} delay={index * 100}>
                <Card className="h-full border-2 hover-elevate" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="p-8 flex flex-col h-full">
                    <Quote className="w-10 h-10 text-primary/20 mb-4" />
                    
                    <blockquote className="text-lg font-medium mb-6 leading-relaxed flex-grow">
                      "{testimonial.quote}"
                    </blockquote>

                    <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t">
                      {testimonial.metrics.map((metric, idx) => (
                        <div key={idx} className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <metric.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="font-bold text-2xl text-primary">{metric.value}</div>
                          <div className="text-sm text-muted-foreground">{metric.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.initials}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>

                    <div className="flex gap-1 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="w-4 h-4 text-secondary fill-secondary" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Deep dive into how we've helped clients achieve transformative results
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {caseStudies.map((study, index) => (
              <ScrollReveal key={study.industry} delay={index * 100}>
                <Card className="h-full border-2 hover-elevate active-elevate-2" data-testid={`card-case-study-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        {study.industry}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">{study.timeframe}</div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Challenge</h4>
                        <p className="text-base leading-relaxed">{study.challenge}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Solution</h4>
                        <p className="text-base leading-relaxed">{study.solution}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3">Results</h4>
                        <ul className="space-y-2">
                          {study.results.map((result, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                              <span className="text-base">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 text-primary font-semibold hover-elevate rounded px-2 py-1 -mx-2 -my-1 cursor-pointer">
                        <span className="text-sm">View Full Case Study</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Gallery Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Portfolio Showcase</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Before & after transformations showing real results from our content strategies
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioItems.map((item, index) => (
              <ScrollReveal key={item.id} delay={index * 100}>
                <Card 
                  className="h-full border-2 hover-elevate active-elevate-2 cursor-pointer overflow-hidden" 
                  onClick={() => setSelectedPortfolioItem(item.id)}
                  data-testid={`card-portfolio-${index}`}
                >
                  <div 
                    className="h-48 flex items-center justify-center relative"
                    style={{ background: item.thumbnail }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-foreground">
                      {item.category}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{item.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Before</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span>{item.before.views}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span>{item.before.engagement}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{item.before.followers}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-primary uppercase">After</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Eye className="w-4 h-4" />
                            <span>{item.after.views}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Heart className="w-4 h-4" />
                            <span>{item.after.engagement}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Users className="w-4 h-4" />
                            <span>{item.after.followers}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t text-center">
                      <div className="text-sm font-semibold text-primary flex items-center justify-center gap-2">
                        <span>View Details</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Modal */}
      {selectedPortfolioItem !== null && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPortfolioItem(null)}
          data-testid="modal-portfolio"
        >
          <div 
            className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPortfolioItem(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-muted rounded-full flex items-center justify-center hover-elevate z-10"
              data-testid="button-close-modal"
            >
              <X className="w-6 h-6" />
            </button>

            {portfolioItems
              .filter(item => item.id === selectedPortfolioItem)
              .map((item) => (
                <div key={item.id} className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      {item.category}
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{item.title}</h2>
                  <p className="text-lg text-muted-foreground mb-8">{item.description}</p>

                  <div 
                    className="h-96 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden"
                    style={{ background: item.thumbnail }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <Card className="border-2">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4 text-muted-foreground">Before Our Work</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm font-semibold text-muted-foreground">Views</span>
                            </div>
                            <div className="text-3xl font-bold">{item.before.views}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm font-semibold text-muted-foreground">Engagement</span>
                            </div>
                            <div className="text-3xl font-bold">{item.before.engagement}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm font-semibold text-muted-foreground">Followers</span>
                            </div>
                            <div className="text-3xl font-bold">{item.before.followers}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/50 bg-primary/5">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4 text-primary">After Our Work</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="w-5 h-5 text-primary" />
                              <span className="text-sm font-semibold text-primary">Views</span>
                            </div>
                            <div className="text-3xl font-bold text-primary">{item.after.views}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-5 h-5 text-primary" />
                              <span className="text-sm font-semibold text-primary">Engagement</span>
                            </div>
                            <div className="text-3xl font-bold text-primary">{item.after.engagement}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-5 h-5 text-primary" />
                              <span className="text-sm font-semibold text-primary">Followers</span>
                            </div>
                            <div className="text-3xl font-bold text-primary">{item.after.followers}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      size="lg" 
                      onClick={() => {
                        setSelectedPortfolioItem(null);
                        setTimeout(scrollToBooking, 100);
                      }} 
                      data-testid="button-book-from-portfolio"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Get Similar Results
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setSelectedPortfolioItem(null)} data-testid="button-close-portfolio">
                      Close
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CTA Section with Calendly */}
      <section id="booking" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Scale Your Content?</h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                Book a free strategy call and let's discuss how we can multiply your reach
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
                    className="bg-white text-primary border-white shadow-2xl text-xl font-semibold"
                    data-testid="button-show-calendly"
                  >
                    <Calendar className="w-6 h-6 mr-2" />
                    Schedule Your Free Call
                  </Button>
                  <p className="mt-6 text-white/80">
                    Or contact us directly below
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
                    Note: Replace the Calendly URL above with your actual Calendly scheduling link
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-lg">
              <a 
                href="tel:6046269278" 
                className="flex items-center gap-3 hover-elevate rounded-lg px-4 py-2 -mx-4 -my-2"
                data-testid="link-phone"
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="font-semibold">604-626-9278</span>
              </a>
              <a 
                href="mailto:arminabadi7@gmail.com" 
                className="flex items-center gap-3 hover-elevate rounded-lg px-4 py-2 -mx-4 -my-2"
                data-testid="link-email"
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="font-semibold">arminabadi7@gmail.com</span>
              </a>
              <a 
                href="https://instagram.com/kabacontent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover-elevate rounded-lg px-4 py-2 -mx-4 -my-2"
                data-testid="link-instagram"
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                  <SiInstagram className="w-6 h-6" />
                </div>
                <span className="font-semibold">@kabacontent</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Kaba Content
              </h3>
              <p className="text-muted-foreground mb-4">
                Professional content creation services that scale your social media presence and drive real results.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1"
                    data-testid="link-footer-services"
                  >
                    Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={scrollToBooking}
                    className="text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1"
                    data-testid="link-footer-contact"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <a 
                    href="https://instagram.com/kabacontent" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1 inline-block"
                    data-testid="link-footer-instagram"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Get in Touch</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="tel:6046269278" 
                    className="flex items-center gap-2 text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1"
                    data-testid="link-footer-phone"
                  >
                    <Phone className="w-4 h-4" />
                    604-626-9278
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:arminabadi7@gmail.com" 
                    className="flex items-center gap-2 text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1"
                    data-testid="link-footer-email"
                  >
                    <Mail className="w-4 h-4" />
                    arminabadi7@gmail.com
                  </a>
                </li>
                <li>
                  <a 
                    href="https://instagram.com/kabacontent" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover-elevate rounded px-2 py-1 -mx-2 -my-1"
                    data-testid="link-footer-instagram-icon"
                  >
                    <SiInstagram className="w-4 h-4" />
                    @kabacontent
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Kaba Content. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
