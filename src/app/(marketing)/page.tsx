"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  MessageSquare,
  PieChart,
  Rocket,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const Section = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <section className={cn("container py-16 md:py-24", className)} {...props}>
    {children}
  </section>
);

export default function EnhancedLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        {/* <TrustedBySection /> */}
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <DetailedFeaturesSection />
        {/* <TestimonialsSection /> */}
        {/* <PricingSection /> */}
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}

const Header = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl">AI-Fi Tracker</span>
        </Link>
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
          <a href="#features" className="transition-colors hover:text-primary">
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-primary"
          >
            How It Works
          </a>
          {/* <a href="#pricing" className="transition-colors hover:text-primary">
            Pricing
          </a> */}
          <a href="#faq" className="transition-colors hover:text-primary">
            FAQ
          </a>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <Section className="pt-24 pb-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <Badge variant="secondary" className="mb-4">
          🎉 Now with AI Budget Recommendations
        </Badge>

        <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl max-w-4xl">
          Stop Manual Data Entry.
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Start Managing Finances by Simply Talking to AI.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
          Transform hours of bookkeeping into minutes. Just describe your
          transactions in natural language and let our AI handle categorization,
          tracking, and insights automatically.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="text-lg px-8">
            <Link href={user ? "/dashboard" : "/auth"}>
              Start Free Trial
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link href="#demo">Watch Demo</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required • 14-day free trial • Cancel anytime
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-16 w-full max-w-6xl"
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-2xl">
            <div className="aspect-video flex items-center justify-center p-8 bg-card/50 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="flex justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-lg border">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="text-sm">AI Chat Interface</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-lg border">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    <span className="text-sm">Real-time Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-lg border">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span className="text-sm">Budget Tracking</span>
                  </div>
                </div>
                <Bot className="mx-auto h-24 w-24 text-primary" />
                <p className="text-muted-foreground">
                  Interactive AI-Powered Finance Dashboard
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
};

const TrustedBySection = () => {
  return (
    <Section className="py-12 bg-muted/30">
      <div className="text-center space-y-8">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">
          Trusted by growing businesses worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
          {[
            "TechCorp",
            "StartupHub",
            "FinanceFlow",
            "BusinessPro",
            "GrowthLabs",
          ].map((company) => (
            <div
              key={company}
              className="text-2xl font-bold text-muted-foreground"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Natural Language Processing",
      description:
        'Save hours every week. Just type "bought coffee 50k from wallet" and let our AI categorize, tag, and record everything instantly. No forms, no hassle.',
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      title: "Smart Insights & Predictive Analytics",
      description:
        "Get AI-generated insights about your spending patterns, budget warnings, and financial recommendations. Know exactly where your money goes and make data-driven decisions.",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Zap,
      title: "Automated Transaction Management",
      description:
        "Track income, expenses, and transfers effortlessly. Our AI handles complex transactions like transfers with fees, automatically updating all fund balances with precision.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <Section id="features">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="text-sm">
          FEATURES
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Why Choose <span className="text-primary">AI-Fi Tracker</span>?
        </h2>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Powerful AI features designed to transform how you manage your
          business finances
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div
                  className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center mb-4",
                    feature.bgColor
                  )}
                >
                  <feature.icon className={cn("h-7 w-7", feature.color)} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      step: "1",
      title: "Connect & Describe",
      description:
        "Simply chat with our AI assistant. Describe your transactions in plain English or Indonesian.",
      icon: MessageSquare,
      example: '"Transfer 1 juta from BCA to cash wallet"',
    },
    {
      step: "2",
      title: "AI Does The Work",
      description:
        "Our AI securely categorizes, records, and updates all fund balances automatically with 99% accuracy.",
      icon: Bot,
      example: "✓ Transaction logged, balances updated",
    },
    {
      step: "3",
      title: "Get Clear Insights",
      description:
        "View your real-time dashboard, budget warnings, and AI-generated financial insights to make smarter decisions.",
      icon: BarChart3,
      example: "⚠️ Food budget at 85%, consider adjusting",
    },
  ];

  return (
    <Section id="how-it-works" className="bg-muted/30">
      <div className="text-center space-y-4 mb-16">
        <Badge variant="outline" className="text-sm">
          HOW IT WORKS
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Simple. Fast. Intelligent.
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          From transaction to insight in just 3 steps
        </p>
      </div>

      <div className="relative">
        {/* Connection Lines */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2" />

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="relative"
            >
              <Card className="h-full border-2 hover:border-primary transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {step.step}
                  </div>
                  <step.icon className="mx-auto h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">{step.description}</p>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                    {step.example}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const UseCasesSection = () => {
  const useCases = [
    {
      icon: Briefcase,
      title: "For Freelancers",
      description:
        "Track project expenses, manage invoices, and monitor cash flow across multiple clients effortlessly.",
      features: [
        "Project-based tracking",
        "Invoice management",
        "Tax preparation",
      ],
    },
    {
      icon: Users,
      title: "For Small Business Owners",
      description:
        "Get a clear overview of your cash flow, control spending, and prepare for tax season with ease.",
      features: [
        "Cash flow monitoring",
        "Expense control",
        "Financial reports",
      ],
    },
    {
      icon: Rocket,
      title: "For Startups",
      description:
        "Monitor your burn rate, budget allocation, and growth metrics without complex accounting software.",
      features: [
        "Burn rate tracking",
        "Budget forecasting",
        "Growth analytics",
      ],
    },
  ];

  return (
    <Section>
      <div className="text-center space-y-4 mb-16">
        <Badge variant="outline" className="text-sm">
          USE CASES
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Built for <span className="text-primary">Your Business</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Whether you're a freelancer, small business, or startup, we've got you
          covered
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {useCases.map((useCase, index) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="h-full hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <useCase.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                <CardDescription className="text-base">
                  {useCase.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {useCase.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const DetailedFeaturesSection = () => {
  const features = [
    {
      title: "Interactive Dashboard",
      description:
        "Real-time financial overview with income, expenses, and profit/loss charts. AI-generated insights highlight important trends.",
      icon: BarChart3,
    },
    {
      title: "Monthly Budget Tracking",
      description:
        "Set budgets for categories, track spending progress, and get AI warnings before you exceed limits.",
      icon: Wallet,
    },
    {
      title: "Transaction Management",
      description:
        "Full CRUD operations with advanced filtering, sorting, and support for income, expense, and transfer types.",
      icon: Calendar,
    },
  ];

  return (
    <Section className="bg-muted/30">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl font-bold md:text-5xl">
          Everything You Need in One Place
        </h2>
      </div>

      <div className="space-y-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(
              "grid md:grid-cols-2 gap-8 items-center",
              index % 2 === 1 && "md:grid-flow-dense"
            )}
          >
            <div className={cn(index % 2 === 1 && "md:col-start-2")}>
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
            <div
              className={cn(
                "bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border-2 border-primary/20",
                index % 2 === 1 && "md:col-start-1 md:row-start-1"
              )}
            >
              <div className="aspect-video flex items-center justify-center">
                <feature.icon className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Small Business Owner",
      quote:
        "AI-Fi Tracker has completely transformed how I handle my business finances. What used to take 5 hours every week now takes just 15 minutes. The AI assistant understands exactly what I need.",
      initials: "SM",
      image: null,
      stats: "Saved 10 hours/month",
    },
    {
      name: "David Chen",
      role: "Freelance Consultant",
      quote:
        "The natural language processing is incredible. I can just say 'client payment 5 million' and everything is recorded perfectly. It's like having a personal accountant available 24/7.",
      initials: "DC",
      image: null,
      stats: "Managing 50+ clients",
    },
    {
      name: "Priya Sharma",
      role: "Startup Founder",
      quote:
        "Budget warnings saved us from overspending last quarter. The AI caught patterns we didn't notice and suggested better allocation. Best financial tool for startups.",
      initials: "PS",
      image: null,
      stats: "20% cost reduction",
    },
  ];

  return (
    <Section>
      <div className="text-center space-y-4 mb-16">
        <Badge variant="outline" className="text-sm">
          TESTIMONIALS
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Trusted by Finance Professionals
        </h2>
        <p className="text-xl text-muted-foreground">
          Join thousands who've simplified their financial workflows
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <Badge variant="secondary">{testimonial.stats}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        { text: "Up to 50 transactions/month", included: true },
        { text: "Basic AI assistant", included: true },
        { text: "3 fund sources", included: true },
        { text: "Basic reports", included: true },
        { text: "Budget tracking", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "99,000",
      priceUnit: "/month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited transactions", included: true },
        { text: "Advanced AI assistant", included: true },
        { text: "Unlimited fund sources", included: true },
        { text: "Advanced analytics & insights", included: true },
        { text: "Budget tracking & forecasting", included: true },
        { text: "Export data (CSV, Excel)", included: true },
        { text: "Priority email support", included: true },
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Multi-user access", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom AI training", included: true },
        { text: "Advanced security features", included: true },
        { text: "24/7 phone support", included: true },
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <Section id="pricing" className="bg-muted/30">
      <div className="text-center space-y-4 mb-16">
        <Badge variant="outline" className="text-sm">
          PRICING
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your business needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative"
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                Most Popular
              </Badge>
            )}
            <Card
              className={cn(
                "h-full flex flex-col",
                plan.popular && "border-primary shadow-xl scale-105"
              )}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">
                    {plan.price === "0"
                      ? "Free"
                      : plan.price === "Custom"
                      ? "Custom"
                      : `Rp ${plan.price}`}
                  </span>
                  {plan.priceUnit && (
                    <span className="text-muted-foreground">
                      {plan.priceUnit}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          !feature.included && "text-muted-foreground"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        All plans include 14-day free trial • No credit card required
      </p>
    </Section>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "Is my financial data secure?",
      answer:
        "Absolutely. We use bank-level encryption (AES-256) for all data transmission and storage. Your data is stored on Supabase's secure infrastructure with automatic backups. We never share your financial information with third parties.",
    },
    {
      question: "What AI technology do you use?",
      answer:
        "We support both OpenAI (GPT-4) and Google Gemini AI models. You can choose your preferred provider in settings. Our AI is specifically trained for financial data processing with 99% accuracy in transaction categorization.",
    },
    {
      question: "Can I export my data?",
      answer:
        "Yes! Pro plan users can export all transactions, reports, and analytics to CSV or Excel format. You maintain full ownership of your data and can download it anytime.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "Currently, we offer a fully responsive web application that works perfectly on mobile browsers. Native iOS and Android apps are in development and will be released in Q2 2025.",
    },
    {
      question: "How accurate is the AI assistant?",
      answer:
        "Our AI has a 99% accuracy rate in understanding and categorizing transactions. It learns from your patterns and gets smarter over time. If it's unsure, it will always ask for clarification before recording.",
    },
    {
      question: "Can I switch between plans?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges based on your billing cycle.",
    },
  ];

  return (
    <Section id="faq">
      <div className="text-center space-y-4 mb-16">
        <Badge variant="outline" className="text-sm">
          FAQ
        </Badge>
        <h2 className="text-4xl font-bold md:text-5xl">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about AI-Fi Tracker
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">Still have questions?</p>
        <Button variant="outline" size="lg">
          Contact Support
        </Button>
      </div>
    </Section>
  );
};

const FinalCTASection = () => {
  const { user } = useAuth();

  return (
    <Section className="bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        <h2 className="text-4xl font-bold md:text-6xl max-w-4xl mx-auto">
          Ready to Transform Your Financial Management?
        </h2>
        <p className="text-xl text-primary-foreground/90 md:text-2xl max-w-2xl mx-auto">
          Join thousands of businesses saving 10+ hours per month on
          bookkeeping. Start your free trial today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-lg px-8"
          >
            <Link href={user ? "/dashboard" : "/auth"}>
              {user ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
          >
            Schedule a Demo
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm pt-8">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </motion.div>
    </Section>
  );
};

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Roadmap", href: "#" },
    ],
    Company: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Support", href: "#" },
      { label: "Status", href: "#" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Cookie Policy", href: "#" },
      { label: "Security", href: "#" },
    ],
  };

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg">AI-Fi Tracker</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Intelligent finance tracking, simplified by AI.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI-Fi Tracker. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Bank-level security</span>
            <span>•</span>
            <span>99.9% uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
