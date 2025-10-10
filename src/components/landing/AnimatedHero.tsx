import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";

const mockPosts = [
  {
    id: 1,
    sport: "Unihockey",
    team: "HC Dragons",
    content: "🏒 Heimspiel heute Abend! 19:30 Uhr in der Sporthalle",
    gradient: "from-blue-500 to-cyan-500",
    result: "5:3 Sieg! 🎉"
  },
  {
    id: 2,
    sport: "Volleyball",
    team: "VBC Eagles",
    content: "🏐 Derby-Kracher am Samstag! Lasst uns die Halle rocken!",
    gradient: "from-purple-500 to-pink-500",
    result: "3:1 Satzgewinn! 💪"
  },
  {
    id: 3,
    sport: "Handball",
    team: "Handball Stars",
    content: "🤾 Auswärtsspiel in Bern - we're ready!",
    gradient: "from-orange-500 to-red-500",
    result: "28:24 Victory! 🔥"
  },
  {
    id: 4,
    sport: "Unihockey",
    team: "Floorball United",
    content: "⭐ MVP des Spiels: Jonas Müller mit 3 Toren!",
    gradient: "from-green-500 to-teal-500",
    result: "Traumtor! 🚀"
  }
];

const headlines = [
  {
    line1: "Aus Emotionen",
    line2: "werden Posts."
  },
  {
    line1: "Poste den Sieg,",
    line2: "teile die Leidenschaft."
  },
  {
    line1: "Deine Fans. Deine Farben.",
    line2: "Dein Post in Sekunden."
  }
];

export const AnimatedHero = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHeadlineAnimating, setIsHeadlineAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockPosts.length);
        setIsAnimating(false);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const headlineInterval = setInterval(() => {
      setIsHeadlineAnimating(true);
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % headlines.length);
        setIsHeadlineAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(headlineInterval);
  }, []);

  const currentPost = mockPosts[currentIndex];
  const currentHeadline = headlines[headlineIndex];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-tight transition-all duration-500 ${
                isHeadlineAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}>
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                  {currentHeadline.line1}
                </span>
                <br />
                <span className="text-foreground">{currentHeadline.line2}</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Dein Spiel, dein Moment, dein Post.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Erstelle in Sekunden professionelle Social Media Posts für dein Team – 
                direkt aus den Spieldaten deines Verbands.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-[var(--shadow-glow)] hover:scale-105 transition-transform"
                onClick={() => navigate('/wizard')}
              >
                Jetzt eigenen Post erstellen
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Wie funktioniert's?
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center lg:justify-start">
              <Instagram className="h-4 w-4" />
              <span>Perfekt für Instagram, Facebook & mehr</span>
            </div>
          </div>

          {/* Right Side - Animated Instagram Feed Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              {/* Phone Frame */}
              <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-[3rem] p-4 shadow-2xl border-8 border-foreground/10">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/80 rounded-b-3xl" />
                
                {/* Screen */}
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  {/* Instagram Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{currentPost.team}</p>
                      <p className="text-xs text-muted-foreground">{currentPost.sport}</p>
                    </div>
                    <Instagram className="h-5 w-5 text-foreground" />
                  </div>

                  {/* Post Image */}
                  <div 
                    className={`aspect-square bg-gradient-to-br ${currentPost.gradient} flex items-center justify-center transition-all duration-300 ${
                      isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                  >
                    <div className="text-center p-8 text-white">
                      <div className="text-6xl font-bold mb-4">{currentPost.result}</div>
                      <div className="text-xl font-medium">{currentPost.team}</div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-4 text-foreground">
                      <span className="text-2xl">❤️</span>
                      <span className="text-2xl">💬</span>
                      <span className="text-2xl">📤</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">{currentPost.team}</span> {currentPost.content}
                    </p>
                    <p className="text-xs text-muted-foreground">vor 2 Stunden</p>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -left-4 top-1/4 animate-float">
                <div className="bg-background border-2 border-primary rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-semibold">⚡ In Sekunden</span>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 animate-float" style={{ animationDelay: "1s" }}>
                <div className="bg-background border-2 border-accent rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-semibold">🎨 Professionell</span>
                </div>
              </div>
              <div className="absolute -left-8 bottom-1/4 animate-float" style={{ animationDelay: "2s" }}>
                <div className="bg-background border-2 border-primary rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-semibold">💯 Gratis starten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};