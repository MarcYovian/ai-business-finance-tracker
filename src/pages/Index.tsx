import { motion } from "framer-motion";
import { ArrowRight, Bot, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Helper component for consistent section styling
const Section = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <section className={cn("container py-16 md:py-24", className)} {...props}>
    {children}
  </section>
);

// Main Page Component
export default function IndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <SocialProofSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}

// 1. Header / Navigation Bar
const Header = () => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
    <div className="container flex h-14 items-center">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <Bot className="h-6 w-6 text-primary" />
        <span className="font-bold">AI-Fi Tracker</span>
      </Link>
      <div className="flex flex-1 items-center justify-end space-x-4">
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </div>
  </header>
);

// 2. Hero Section
const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <Section className="text-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-extrabold tracking-tight md:text-6xl"
        >
          Intelligent Finance Tracking,
          <br />
          <span className="text-accent">Simplified by AI.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Stop wrestling with spreadsheets. Just describe your transactions in
          plain English and let our AI handle the rest. Get insights, save time,
          and take control of your business finances.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8">
          <Button size="lg" asChild>
            <Link to="/auth">
              Get Started for Free
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 w-full max-w-4xl overflow-hidden rounded-lg border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 shadow-2xl"
        >
          <div className="aspect-video flex items-center justify-center p-8">
            <div className="text-center">
              <Bot className="mx-auto h-20 w-20 text-accent" />
              <p className="mt-4 text-sm text-muted-foreground">
                AI-Powered Finance Dashboard Preview
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
};

// 3. Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Assistant",
      description:
        "Describe transactions in natural language. Our AI automatically categorizes, tags, and organizes your financial data with precision.",
    },
    {
      icon: TrendingUp,
      title: "Smart Insights",
      description:
        "Get actionable financial insights and trends. Identify spending patterns, forecast cash flow, and make data-driven decisions effortlessly.",
    },
    {
      icon: Zap,
      title: "Effortless Tracking",
      description:
        "No more manual entry. AI-powered automation handles receipts, invoices, and transactions, saving you hours every week.",
    },
  ];

  return (
    <Section className="bg-muted/30">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          Why Choose <span className="text-accent">AI-Fi Tracker</span>?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Powerful features designed to transform how you manage your finances.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className="h-full border-accent/20 hover:border-accent/50 transition-colors">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-accent mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
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

// 4. Social Proof / Testimonials Section
const SocialProofSection = () => {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Small Business Owner",
      quote:
        "AI-Fi Tracker has completely transformed how I handle my business finances. What used to take hours now takes minutes.",
      initials: "SM",
    },
    {
      name: "David Chen",
      role: "Freelance Consultant",
      quote:
        "The AI assistant understands exactly what I need. It's like having a personal accountant available 24/7.",
      initials: "DC",
    },
  ];

  return (
    <Section>
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          Trusted by Finance Professionals
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join thousands who've simplified their financial workflows.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
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
                  <Avatar>
                    <AvatarFallback className="bg-accent text-accent-foreground">
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
              <CardContent>
                <p className="text-muted-foreground italic">
                  "{testimonial.quote}"
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

// 5. Final Call-to-Action
const FinalCTASection = () => {
  return (
    <Section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold md:text-5xl">
          Ready to take control of your finances?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/90 md:text-xl">
          Start tracking smarter, not harder. Join AI-Fi Tracker today.
        </p>
        <Button size="lg" variant="secondary" asChild className="mt-8">
          <Link to="/auth">
            Sign Up Now
            <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
};

// 6. Footer
const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-bold">AI-Fi Tracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI-Fi Tracker. All rights reserved.
          </p>
          <nav className="flex space-x-4 text-sm">
            <Link
              to="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
