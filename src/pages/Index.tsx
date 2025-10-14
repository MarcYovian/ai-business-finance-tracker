
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, TrendingUp, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Helper component for consistent section styling
const Section = ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => (
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
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            Simplified by AI.
          </span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Stop wrestling with spreadsheets. Just describe your transactions in plain English and let our AI handle the rest. Get insights, save time, and take control of your business finances.
        </motion.p>
        <motion.div variants={itemVariants} className="mt-8">
          <Button size="lg" asChild>
            <Link to="/auth">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        className="relative mx-auto mt-12 max-w-4xl"
      >
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-400/50 to-primary/50 opacity-25 blur-xl" />
        <div className="relative h-full w-full rounded-lg border bg-muted/40 p-4 shadow-xl">
          <div className="flex h-72 items-center justify-center rounded-md bg-background/50">
            <p className="text-muted-foreground">Product Screenshot Placeholder</p>
          </div>
        </div>
      </motion.div>
    </Section>
  );
};

// 3. Features Section
const features = [
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "AI-Powered Assistant",
    description: "Just type or speak. Our AI understands natural language to categorize transactions instantly.",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: "Smart Insights",
    description: "Discover spending patterns and get actionable insights to optimize your business finances.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Effortless Tracking",
    description: "Connect your accounts and let the app automatically sync and manage everything for you.",
  },
];

const FeaturesSection = () => (
  <Section id="features" className="bg-muted/40">
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why You'll Love AI-Fi Tracker</h2>
      <p className="mt-2 text-lg text-muted-foreground">Everything you need, nothing you don't.</p>
    </div>
    <div className="mt-12 grid gap-8 md:grid-cols-3">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <Card className="h-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {feature.icon}
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </Section>
);

// 4. Social Proof / Testimonials Section
const testimonials = [
  {
    name: "Alex Johnson",
    title: "Freelance Designer",
    quote: "AI-Fi Tracker has been a game-changer. I've saved hours every week. It's like having a personal bookkeeper who's always on call.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Samantha Lee",
    title: "E-commerce Store Owner",
    quote: "Finally, a finance app that gets it. The AI categorization is incredibly accurate and the insights have helped me boost my profitability.",
    avatar: "https://i.pravatar.cc/150?img=45",
  },
];

const SocialProofSection = () => (
  <Section id="testimonials">
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Trusted by Professionals</h2>
      <p className="mt-2 text-lg text-muted-foreground">See what others are saying about us.</p>
    </div>
    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
      {testimonials.map((testimonial, i) => (
        <motion.div
          key={testimonial.name}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: i * 0.2 }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <Card className="flex h-full flex-col">
            <CardContent className="flex-grow p-6">
              <p className="text-muted-foreground">"{testimonial.quote}"</p>
            </CardContent>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  </Section>
);

// 5. Final Call to Action (CTA) Section
const FinalCTASection = () => (
  <Section className="bg-muted/40">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-3xl text-center"
    >
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
        Ready to Take Control of Your Finances?
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Join hundreds of businesses simplifying their financial management with AI.
      </p>
      <Button size="lg" className="mt-8" asChild>
        <Link to="/auth">Sign Up Now</Link>
      </Button>
    </motion.div>
  </Section>
);

// 6. Footer
const Footer = () => (
  <footer className="border-t">
    <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} AI-Fi Tracker. All rights reserved.
      </p>
      <nav className="flex gap-4">
        <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
          Privacy Policy
        </Link>
        <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
          Terms of Service
        </Link>
      </nav>
    </div>
  </footer>
);
