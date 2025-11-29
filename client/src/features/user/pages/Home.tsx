import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroSection } from "@/components/HeroSection";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Truck, Shield, Clock } from "lucide-react";
import heritageImage from "@assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const heritageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(featuresRef.current?.children || [], {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top bottom-=100",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.from(heritageRef.current, {
        scrollTrigger: {
          trigger: heritageRef.current,
          start: "top bottom-=100",
        },
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  const collections = [
    {
      name: "Silk Sarees",
      description: "Luxurious silk weaves with timeless elegance",
      href: "/products?fabric=Silk",
    },
    {
      name: "Wedding Collection",
      description: "Grand designs for your special moments",
      href: "/products?occasion=Wedding",
    },
    {
      name: "Festive Wear",
      description: "Celebrate traditions with vibrant colors",
      href: "/products?occasion=Festive",
    },
    {
      name: "Designer Sarees",
      description: "Contemporary styles with traditional roots",
      href: "/products",
    },
  ];

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Handcrafted Quality",
      description: "Every saree is crafted by skilled artisans",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Free Shipping",
      description: "On orders above ₹5,000",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Authentic Products",
      description: "100% genuine textiles guaranteed",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Easy Returns",
      description: "7-day hassle-free returns",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />

      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-mono uppercase tracking-widest mb-4 text-muted-foreground">
              Explore Our Collections
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-normal">
              Discover Your Perfect Saree
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {collections.map((collection, index) => (
              <Link key={collection.name} href={collection.href}>
                <a data-testid={`link-collection-${index}`}>
                  <Card className="p-8 md:p-10 hover-elevate transition-all duration-300 h-full">
                    <h3 className="text-2xl md:text-3xl font-serif font-medium mb-3">
                      {collection.name}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {collection.description}
                    </p>
                    <Button variant="outline">Explore Collection</Button>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 md:px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={heritageRef} className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-sm font-mono uppercase tracking-widest mb-4 text-muted-foreground">
                Our Heritage
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-normal mb-6">
                Preserving Traditional Craftsmanship
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Each saree in our collection represents centuries of textile artistry passed down through generations. We work directly with master weavers across India to bring you authentic, handcrafted sarees that celebrate our rich cultural heritage.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                From the intricate zari work of Banarasi silk to the vibrant colors of Kanjivaram, every piece tells a unique story of skill, patience, and artistic excellence.
              </p>
              <Link to="/products">
                <a data-testid="link-view-collection">
                  <Button size="lg">View Full Collection</Button>
                </a>
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={heritageImage}
                  alt="Traditional zari embroidery craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Moha. Celebrating India's textile heritage.
          </p>
        </div>
      </footer>
    </div>
  );
}
