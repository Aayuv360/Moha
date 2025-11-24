import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/Model_in_burgundy_saree_hero_554d9242.png";

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(imageRef.current, {
        scale: 1.1,
        duration: 1.5,
      })
        .from(
          contentRef.current?.children || [],
          {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
          },
          "-=1"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative h-screen min-h-[600px] overflow-hidden"
      data-testid="section-hero"
    >
      <div
        ref={imageRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center">
        <div
          ref={contentRef}
          className="max-w-2xl text-white"
        >
          <p className="text-sm md:text-base font-mono uppercase tracking-widest mb-4 md:mb-6">
            Heritage Reimagined
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light leading-tight mb-4 md:mb-6">
            Timeless Elegance in Every Thread
          </h1>
          <p className="text-base md:text-lg leading-relaxed mb-6 md:mb-8 text-white/90 max-w-xl">
            Discover handcrafted sarees that celebrate India's rich textile heritage. From traditional silk to contemporary designs, each piece tells a story.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              variant="default"
              className="px-8 bg-primary/90 backdrop-blur-sm hover:bg-primary"
              asChild
            >
              <Link href="/products" data-testid="button-shop-collection">
                Shop Collection
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              asChild
            >
              <Link href="/products?occasion=Wedding" data-testid="button-wedding-collection">
                Wedding Collection
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
