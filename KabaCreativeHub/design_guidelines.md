# Kaba Content - Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from modern SaaS and creative agency leaders like Linear (clean, modern aesthetic), Stripe (trust-building simplicity), and Webflow (creative showcase).

**Core Philosophy**: Create a conversion-optimized landing page that balances creative energy with professional trust-building, showcasing Kaba Content's services while making it effortless to book a call.

## Color System
- **Primary Gradient**: Deep blue (#1E3A8A) to vibrant cyan (#06B6D4) - modern, trustworthy, energetic
- **Accent**: White (#FFFFFF) for contrast and breathing room
- **Supporting**: Light gray (#F8FAFC) for subtle backgrounds, dark slate (#0F172A) for text

## Typography
- **Headings**: Inter (700-800 weight) - clean, modern, geometric
- **Body**: Inter (400-500 weight) - excellent readability
- **Accent/Numbers**: Space Grotesk (600-700) for metrics and stats - adds personality

**Hierarchy**:
- Hero H1: text-6xl md:text-7xl lg:text-8xl
- Section H2: text-4xl md:text-5xl
- Service Cards: text-2xl md:text-3xl
- Body: text-lg
- Small/Caption: text-sm

## Layout System
**Spacing Primitives**: Use Tailwind units of 4, 8, 12, 16, and 24 consistently
- Section padding: py-16 md:py-24 lg:py-32
- Component gaps: gap-8 or gap-12
- Container: max-w-7xl with px-4 md:px-8

## Page Structure

### 1. Hero Section (80vh)
- Full-width gradient background with subtle animated mesh/grain overlay
- Large, bold headline emphasizing results: "Scale Your Content. Multiply Your Reach."
- Subheadline highlighting the 500+ clips/month differentiator
- Dual CTAs: Primary "Book a Strategy Call" + Secondary "View Our Services"
- Trust indicators: Client logos or stat badges ("500+ Clips. 10M+ Views Generated.")
- Hero image: Dynamic collage of social media content/video thumbnails showing the work in action

### 2. Services Grid (3 Columns Desktop, 1 Mobile)
- Six service cards with icons, titles, and concise descriptions
- Cards: Video Editing, Scripting, Video Ideation, Social Media Management, Content Distribution (500+ clips), Analytics & Growth
- Gradient border effect on hover, subtle scale animation
- Each card includes key benefit statement

### 3. Results/Metrics Section
- Dark gradient background for contrast
- 4-column stat display: "500+ Clips/Month", "10M+ Views", "50+ Clients", "24hr Turnaround"
- Large numbers with animated count-up on scroll into view
- Brief explanatory text under each stat

### 4. How It Works (Process)
- 3-step horizontal timeline
- Step numbers in gradient circles
- Clear, action-oriented titles: "1. Book Your Call" → "2. We Create" → "3. You Grow"
- Icons and brief descriptions for each step

### 5. Social Proof/Portfolio Teaser
- 2-column layout showcasing before/after metrics or sample work
- Video thumbnail placeholders with play buttons
- Client testimonial quote overlaid on gradient card

### 6. CTA Section
- Centered, prominent section with gradient background
- Headline: "Ready to Scale Your Content?"
- Embedded Calendly widget or modal trigger
- Alternative contact options below: phone, email, Instagram (with icons)

### 7. Footer
- 3-column layout: Company info, Quick Links, Contact & Social
- Company: Logo, tagline, copyright
- Quick Links: Services, About, Contact, Privacy
- Contact: Phone (604-626-9278), Email (arminabadi7@gmail.com), Instagram link (@kabacontent)
- Subtle gradient divider above footer

## Component Design

### Buttons
- Primary: Gradient blue background, white text, rounded-xl, px-8 py-4, font-semibold
- Buttons on hero image: Backdrop blur (backdrop-blur-md bg-white/20) with white text
- No custom hover states needed - use default button hover behavior

### Cards
- White background, subtle shadow (shadow-lg), rounded-2xl
- Padding: p-8
- Gradient border accent using pseudo-elements
- Hover: Transform scale-105, increased shadow

### Icons
- Use Heroicons (outline style) throughout for consistency
- Size: w-8 h-8 for service cards, w-12 h-12 for process steps

## Animations & Motion
- **Scroll Animations**: Fade-in and slide-up for sections as they enter viewport
- **Hero**: Subtle floating animation on hero image elements
- **Gradient Mesh**: Slow-moving animated gradient in hero background
- **Number Counters**: Animate stats counting up when visible
- **Hover Effects**: Smooth scale transforms on cards (duration-300)
- **Page Load**: Stagger section appearances for polish

Keep animations subtle and purposeful - enhance without distracting.

## Images

### Hero Section
- **Large hero visual**: Montage/collage of social media content thumbnails, video editing workspace, or motion graphics - showing the creative process and results
- Position: Right side on desktop (60% width), full-width stacked on mobile
- Treatment: Slight blur/gradient overlay at edges to blend with background

### Services/Portfolio Section  
- **Video thumbnails**: Placeholder images representing different content types (YouTube, Instagram Reels, TikTok)
- Size: 16:9 aspect ratio for video, square for social posts
- Include subtle play button overlays

## Accessibility
- Maintain WCAG AA contrast ratios (white text on gradient blues)
- Focus states visible on all interactive elements
- Skip to main content link
- Alt text for all images
- Semantic HTML structure