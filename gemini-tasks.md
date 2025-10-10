# Prompt: Redesign the Landing Page for "AI-Fi Tracker" with Advanced UI, Animations, and a Modern Color Palette

## 1. Role and Goal

Act as an expert senior frontend developer and UI/UX designer specializing in creating premium, modern, and engaging landing pages. Your goal is to completely redesign and build the UI for the landing page (`src/pages/Index.tsx`) of a SaaS application named **"AI-Fi Tracker"**.

The new design must be fully responsive (mobile-first) and built using **React, TypeScript, Vite, Tailwind CSS, shadcn/ui components, and Framer Motion for animations**.

## 2. Design, Animation, and Aesthetics

The landing page's primary goal is to look professional, trustworthy, and technologically advanced to attract users and encourage sign-ups.

- **Color Palette (Modern & Trustworthy Blue)**:

  - **Primary Color**: Use a deep navy blue (approx. `#0A2540`) for primary buttons and key highlights. Map this to `hsl(var(--primary))`.
  - **Accent Color**: Use a vibrant cyan/teal (approx. `#00D4FF`) for secondary highlights, icons, and gradients. Map this to `hsl(var(--accent))`.
  - **Background**: Use a clean, light gray (approx. `#F8F9FA`). Map this to `hsl(var(--background))`.
  - **Text**: Use a dark gray (approx. `#1F2937`). Map this to `hsl(var(--foreground))`.

- **Animations (using Framer Motion)**:

  - **On-Load Animation**: The Hero Section elements (headline, description, buttons) should stagger-fade-in on page load.
  - **Scroll Animation**: All subsequent sections (Features, Testimonials, CTA) should smoothly fade in and slide up as they enter the viewport (`whileInView`).
  - **Micro-interactions**: Buttons and Cards should have a subtle scale-up effect on hover (`whileHover={{ scale: 1.03 }}`).

- **Component Library**: You **MUST** use components from `shadcn/ui` (e.g., `<Button>`, `<Card>`).
- **Icons**: You **MUST** use icons from the `lucide-react` library.

## 3. Required File and Component Structure

Please provide the complete, single-file code for `src/pages/Index.tsx`. Integrate `framer-motion` for all animations as described below. The page should be structured with these sections:

### a. Header / Navigation Bar

A sticky, translucent navigation bar with a frosted glass effect (`backdrop-blur-lg`).

- **Left Side**: The app name "AI-Fi Tracker" with a `<Bot />` icon.
- **Right Side**: "Login" (`variant="ghost"`) and "Sign Up" buttons that navigate to `/auth`.

### b. Hero Section

- **Layout**: Centered text with a compelling visual below.
- **Content**:
  - Headline: `Intelligent Finance Tracking, Simplified by AI.`
  - Subheading: "Stop wrestling with spreadsheets. Just describe your transactions in plain English and let our AI handle the rest. Get insights, save time, and take control of your business finances."
  - CTA: A large primary `<Button>` saying "Get Started for Free" with an `<ArrowRight />` icon.
- **Visual Element**: A placeholder `div` for a product screenshot, styled with rounded corners and a subtle gradient border using the accent color.
- **Animation**: Apply a staggered `initial={{ opacity: 0, y: 20 }}` to `animate={{ opacity: 1, y: 0 }}` effect to the headline, subheading, and CTA.

### c. Features Section

- **Layout**: A 3-column grid on desktop, stacking to a single column on mobile.
- **Content**: Use `motion.div` wrapped `<Card>` components for each feature.
  - **Icons**: `<Bot />` (AI Assistant), `<TrendingUp />` (Smart Insights), `<Zap />` (Effortless Tracking). Place each icon in a colored circle.
- **Animation**: Each card should have `initial={{ opacity: 0, y: 50 }}` and `whileInView={{ opacity: 1, y: 0 }}` with a `viewport={{ once: true }}` prop. Apply a small delay for each card to make them appear sequentially.

### d. Social Proof / Testimonials Section

- **Layout**: A 2-column grid.
- **Content**: Use `motion.div` wrapped `<Card>` components for two placeholder testimonials, each with an `<Avatar>`, name, and quote.
- **Animation**: Apply the same `whileInView` fade-in and slide-up animation as the Features section.

### e. Final Call to Action (CTA) Section

- **Content**: A centered headline: "Ready to take control of your finances?" followed by a large "Sign Up Now" `<Button>`.
- **Animation**: Apply the `whileInView` animation.

### f. Footer

- **Content**: Simple footer with app name, copyright, and placeholder links.

## 4. Final Output

Provide the complete, single-file code for `src/pages/Index.tsx`. The code must import `motion` from `framer-motion` and use it to implement all the specified animations. The styling must reflect the modern color palette and be fully responsive.
