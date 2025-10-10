import { ArrowRight, Bot, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Hero section scroll animations
  const { scrollYProgress: heroScrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScrollYProgress, [0, 1], ["0%", "30%"]);

  // Features section scroll animations
  const { scrollYProgress: featuresScrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end end"]
  });
  const card1Opacity = useTransform(featuresScrollYProgress, [0, 0.3], [0, 1]);
  const card1Y = useTransform(featuresScrollYProgress, [0, 0.3], ["50px", "0px"]);
  const card2Opacity = useTransform(featuresScrollYProgress, [0.1, 0.4], [0, 1]);
  const card2Y = useTransform(featuresScrollYProgress, [0.1, 0.4], ["50px", "0px"]);
  const card3Opacity = useTransform(featuresScrollYProgress, [0.2, 0.5], [0, 1]);
  const card3Y = useTransform(featuresScrollYProgress, [0.2, 0.5], ["50px", "0px"]);

  // Testimonials section scroll animations
  const { scrollYProgress: testimonialsScrollYProgress } = useScroll({
    target: testimonialsRef,
    offset: ["start end", "end start"]
  });
  const leftCardX = useTransform(testimonialsScrollYProgress, [0, 0.5], ["-50px", "0px"]);
  const leftCardOpacity = useTransform(testimonialsScrollYProgress, [0, 0.5], [0, 1]);
  const rightCardX = useTransform(testimonialsScrollYProgress, [0, 0.5], ["50px", "0px"]);
  const rightCardOpacity = useTransform(testimonialsScrollYProgress, [0, 0.5], [0, 1]);

  // CTA section scroll animations
  const { scrollYProgress: ctaScrollYProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"]
  });
  const ctaBackground = useTransform(ctaScrollYProgress, [0, 1], ["hsl(210 40% 96.1%)", "hsl(202 70% 8%)"]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            <span className="font-bold text-lg">AI-Fi Tracker</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")}
                className="text-foreground hover:bg-accent"
              >
                Login
              </Button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sign Up
                </Button>
              </motion.div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="py-12 md:py-20 lg:py-28">
          <div className="container">
            <div className="flex flex-col items-center text-center">
              <motion.h1 
                className="scroll-m-20 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                Intelligent Finance Tracking, Simplified by AI.
              </motion.h1>
              <motion.p 
                className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              >
                Stop wrestling with spreadsheets. Just describe your transactions
                in plain English and let our AI handle the rest. Get insights,
                save time, and take control of your business finances.
              </motion.p>
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg gap-2"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started for Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div 
                className="mt-12 w-full max-w-4xl"
                style={{ y: heroImageY }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-accent rounded-xl blur-lg opacity-30"></div>
                  <div className="relative rounded-xl border border-border overflow-hidden bg-muted p-4">
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/70 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-accent mb-4">
                          <Bot className="h-8 w-8 text-accent-foreground" />
                        </div>
                        <p className="text-muted-foreground">AI-Fi Tracker Dashboard Preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold tracking-tight">
                Why You'll Love AI-Fi Tracker
              </h2>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-3">
              <motion.div
                style={{ opacity: card1Opacity, y: card1Y }}
                className="h-full"
              >
                <Card className="h-full border border-border bg-card hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="items-center">
                    <motion.div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Bot className="h-6 w-6" />
                    </motion.div>
                    <CardTitle>AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Describe transactions in natural language. Our AI parses,
                      categorizes, and records them for you.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                style={{ opacity: card2Opacity, y: card2Y }}
                className="h-full"
              >
                <Card className="h-full border border-border bg-card hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="items-center">
                    <motion.div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      whileHover={{ scale: 1.1 }}
                    >
                      <TrendingUp className="h-6 w-6" />
                    </motion.div>
                    <CardTitle>Smart Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Gain a deeper understanding of your spending habits and
                      financial health with AI-powered analytics.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                style={{ opacity: card3Opacity, y: card3Y }}
                className="h-full"
              >
                <Card className="h-full border border-border bg-card hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="items-center">
                    <motion.div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Zap className="h-6 w-6" />
                    </motion.div>
                    <CardTitle>Effortless Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Quickly add expenses and income on the go. Spend less time
                      on bookkeeping and more on your business.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Social Proof / Testimonials Section */}
        <section ref={testimonialsRef} className="py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold tracking-tight">
                Loved by Founders Everywhere
              </h2>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                style={{ x: leftCardX, opacity: leftCardOpacity }}
              >
                <Card className="h-full border border-border bg-card">
                  <CardContent className="pt-6">
                    <blockquote className="italic text-muted-foreground">
                      "AI-Fi Tracker has revolutionized how I manage my startup's
                      finances. It's like having a personal bookkeeper available
                      24/7. I can't imagine going back to spreadsheets."
                    </blockquote>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                          alt="Jane Doe"
                        />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>Jane Doe</CardTitle>
                        <CardDescription>Founder of TechCorp</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
              <motion.div
                style={{ x: rightCardX, opacity: rightCardOpacity }}
              >
                <Card className="h-full border border-border bg-card">
                  <CardContent className="pt-6">
                    <blockquote className="italic text-muted-foreground">
                      "The ability to just write down what I spent money on and
                      have it automatically categorized is a game-changer. It
                      saves me hours every month."
                    </blockquote>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                          alt="John Smith"
                        />
                        <AvatarFallback>JS</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>John Smith</CardTitle>
                        <CardDescription>CEO of Innovate LLC</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section ref={ctaRef} className="py-16 md:py-24">
          <motion.div 
            style={{ backgroundColor: ctaBackground }}
            className="transition-colors duration-300"
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Ready to take control of your finances?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                  Start your free trial today. No credit card required.
                </p>
                <motion.div
                  className="mt-8"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg"
                    onClick={() => navigate("/auth")}
                  >
                    Sign Up Now
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-10 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">AI-Fi Tracker</p>
              </div>
              <p className="text-center text-sm text-muted-foreground md:text-left">
                © 2025 AI-Fi Tracker. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a 
                href="/privacy-policy" 
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms-of-service" 
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;