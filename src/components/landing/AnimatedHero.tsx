import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";

const mockPosts = [
  {
    id: 1,
    sport: "Unihockey",
    team: "EC LaLärwe Sport",
    opponent: "FC Lugano",
    score: "3 - 1",
    gradient: "from-[#2979FF] to-[#1E5FCC]",
    resultText: "3 - 1"
  },
  {
    id: 2,
    sport: "Volleyball",
    team: "VBC Eagles",
    opponent: "VBC Zürich",
    score: "3 - 1",
    gradient: "from-[#FF4E56] to-[#CC3E44]",
    resultText: "3 - 1"
  },
  {
    id: 3,
    sport: "Handball",
    team: "Handball Stars",
    opponent: "HC Bern",
    score: "28 - 24",
    gradient: "from-[#2979FF] to-[#FF4E56]",
    resultText: "28 - 24"
  }
];

export const AnimatedHero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine if we should show light mode (check system preference if theme is 'system')
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockPosts.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentPost = mockPosts[currentIndex];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <div className="space-y-8 text-left order-2 lg:order-1">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-primary block mb-2">
                  {t.hero.headline1}
                </span>
                <span className="text-primary block mb-2">
                  {t.hero.headline2}
                </span>
                <span className="text-foreground">
                  {t.hero.headline3}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-foreground/90 max-w-xl leading-relaxed">
                {t.hero.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                variant="default"
                className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg"
                onClick={() => navigate('/studio')}
              >
                {t.hero.ctaPrimary}
              </Button>
            </div>

            <div className="space-y-2 text-foreground/70">
              <p className="text-base">
                {t.hero.description}
              </p>
            </div>
          </div>

          {/* Right Side - Phone Mockup */}
          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto max-w-sm">
              {/* Phone Frame */}
              <div className="relative bg-gradient-to-br from-[#1C1C28] to-[#2A2A38] rounded-[3.5rem] p-3 shadow-2xl border-[14px] border-[#0A0A0F]">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-[#0A0A0F] rounded-b-3xl z-10" />

                {/* Screen */}
                <div className={`${isDarkMode ? 'bg-[#000000]' : 'bg-white'} rounded-[2.75rem] overflow-hidden relative transition-colors duration-300`}>
                  {/* Status Bar */}
                  <div className={`flex items-center justify-between px-6 pt-3 pb-2 ${isDarkMode ? 'text-white' : 'text-black'} text-xs`}>
                    <span className="font-semibold">12:41</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-4 h-3 border ${isDarkMode ? 'border-white' : 'border-black'} rounded-sm`} />
                      <div className={`w-0.5 h-2 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded`} />
                    </div>
                  </div>

                  {/* Instagram Header */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} transition-colors duration-300`}>
                    <button className={isDarkMode ? 'text-white' : 'text-black'}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <div className="flex-1 text-center">
                      <p className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold text-sm`}>Maranday 8</p>
                      <p className={`${isDarkMode ? 'text-white' : 'text-black'} font-bold text-base`}>KANVA</p>
                    </div>
                    <div className="w-6" />
                  </div>

                  {/* Post Image - Dynamic */}
                  <div
                    className={`aspect-[4/5] bg-gradient-to-br ${currentPost.gradient} flex items-center justify-center transition-all duration-500 ${
                      isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    } relative`}
                  >
                    {/* Score Display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#2979FF] text-white px-8 py-6 rounded-2xl font-bold text-6xl flex items-center gap-4">
                        <span>3</span>
                        <span className="text-4xl">-</span>
                        <span className="bg-[#FF4E56] px-6 py-4 rounded-xl">1</span>
                      </div>
                    </div>

                    {/* Team Names */}
                    <div className="absolute bottom-8 left-8 right-8 flex justify-between text-white text-sm font-semibold">
                      <span>{currentPost.team}</span>
                      <span>{currentPost.opponent}</span>
                    </div>

                    {/* Background Image Effect */}
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  {/* Instagram Actions */}
                  <div className={`px-4 py-3 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} transition-colors duration-300`}>
                    <div className="flex items-center gap-4 mb-3">
                      <button className={isDarkMode ? 'text-white' : 'text-black'}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button className={isDarkMode ? 'text-white' : 'text-black'}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </button>
                      <button className={isDarkMode ? 'text-white' : 'text-black'}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                      <button className={`${isDarkMode ? 'text-white' : 'text-black'} ml-auto`}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>

                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-sm mb-1`}>
                      <span className="font-semibold">1,23a likes</span>
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-sm`}>
                      <span className="font-semibold">KANVA</span> Your caption moretth
                    </p>
                    <p className="text-gray-500 text-xs mt-1">CHF 5/month</p>
                  </div>

                  {/* Bottom Navigation */}
                  <div className={`flex items-center justify-around px-4 py-4 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} transition-colors duration-300`}>
                    <button className={isDarkMode ? 'text-white' : 'text-black'}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
