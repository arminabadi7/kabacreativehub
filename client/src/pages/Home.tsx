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
  Rocket
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
    description: "Upload 500+ optimized clips per month to maximize your reach and engagement."
  },
  {
    icon: TrendingUp,
    title: "Analytics & Growth",
    description: "Data-driven insights to continuously improve performance and scale results."
  }
];

const stats = [
  { number: "500+", label: "Clips Per Month", suffix: "" },
  { number: "10", label: "Million+ Views", suffix: "M+" },
  { number: "50+", label: "Happy Clients", suffix: "+" },
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
                <span className="text-sm font-semibold">500+ Clips. 10M+ Views Generated.</span>
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
                We create <span className="font-bold text-secondary">500+ clips per month</span> to boost your views, followers, and sales.
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
                    <AnimatedCounter target={10} suffix="M+" />
                  ) : index === 0 ? (
                    <div className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold">500+</div>
                  ) : index === 2 ? (
                    <AnimatedCounter target={50} suffix="+" />
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

      {/* Social Proof */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <Card className="max-w-4xl mx-auto border-2">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Sparkles key={i} className="w-6 h-6 text-secondary fill-secondary" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-2xl md:text-3xl font-semibold mb-6 leading-relaxed">
                  "Kaba Content transformed our social media presence. Within 3 months, we went from 10K to 150K followers and 5x'd our revenue. Their content strategy is unmatched."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    JD
                  </div>
                  <div>
                    <div className="font-semibold text-lg">John Doe</div>
                    <div className="text-muted-foreground">Content Creator & Coach</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

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
