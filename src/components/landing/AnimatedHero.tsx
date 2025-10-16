import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";

const mockPosts = [
  {
    id: 1,
    sport: "Unihockey",
    team: "Kadetten UH Schaffhausen",
    colorTeam: "#f89828",
    scoreTeam: "5",
    opponent: "UHC Winterthur United",
    colorOpponent: "#fc4349",
    scoreOpponent: "3",
    gradient: "from-[#f89828] to-[#fc4349]",
    likes: "1,2k",
    caption: "Dein Sportmoment in wenigen Sekunden",
    backgroundImage: "/mockup/kadetten-winu.JPG",
  },
  {
    id: 2,
    sport: "Volleyball",
    team: "VBC Schaffhausen",
    colorTeam: "#FFD000",
    scoreTeam: "1",
    opponent: "Volley Aadorf",
    colorOpponent: "#003eaa",
    scoreOpponent: "3",
    gradient: "from-[#ff8f00] to-[#e1241b]",
    likes: "847",
    caption: "Auswärtssieg in Schaffhausen! 🥳",
    backgroundImage: "/mockup/vbcsh-aadorf.jpg",
  },
  {
    id: 3,
    sport: "Handball",
    team: "Kadetten Schaffhausen",
    colorTeam: "#eb6000",
    scoreTeam: "37",
    opponent: "Wacher Thun",
    colorOpponent: "#0F7973",
    scoreOpponent: "30",
    gradient: "from-[#eb6000] to-[#ec1919]",
    likes: "2,4k",
    caption: "Heimsieg in der BBC Arena! 🔥",
    backgroundImage: "/mockup/kadetten-wacker.jpg",
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

  // Get current date formatted in German
  const getCurrentDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formatted = formatter.format(now);
    // Capitalize first letter of weekday
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const currentDate = getCurrentDate();

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-20 sm:pt-16">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary rounded-full blur-[100px] opacity-20 sm:opacity-15 md:opacity-20 lg:opacity-25 animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent rounded-full blur-[100px] opacity-20 sm:opacity-15 md:opacity-20 lg:opacity-25 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary rounded-full blur-[80px] opacity-15 sm:opacity-10 md:opacity-15 lg:opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/4 w-48 h-48 bg-primary/60 rounded-full blur-[60px] opacity-10 sm:opacity-8 md:opacity-10 lg:opacity-15 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-accent/60 rounded-full blur-[90px] opacity-12 sm:opacity-8 md:opacity-12 lg:opacity-18 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/6 right-1/6 w-56 h-56 bg-primary/40 rounded-full blur-[70px] opacity-8 sm:opacity-6 md:opacity-8 lg:opacity-12 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/6 left-1/6 w-80 h-80 bg-accent/30 rounded-full blur-[110px] opacity-6 sm:opacity-4 md:opacity-6 lg:opacity-10 animate-pulse" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-2/3 right-1/2 w-40 h-40 bg-secondary/50 rounded-full blur-[50px] opacity-9 sm:opacity-7 md:opacity-9 lg:opacity-13 animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <div className="space-y-6 sm:space-y-8 text-left order-2 lg:order-1">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="text-primary block mb-1 sm:mb-2">
                  {t.hero.headline1}
                </span>
                <span className="text-primary block mb-1 sm:mb-2">
                  {t.hero.headline2}
                </span>
                <span className="text-foreground">
                  {t.hero.headline3}
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/90 max-w-xl leading-relaxed">
                {t.hero.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                variant="default"
                className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg"
                onClick={() => navigate('/studio')}
              >
                {t.hero.ctaPrimary}
              </Button>
            </div>

            <div className="space-y-2 text-foreground/70">
              <p className="text-sm sm:text-base">
                {t.hero.description}
              </p>
            </div>
          </div>

          {/* Right Side - Phone Mockup */}
          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto max-w-[280px] sm:max-w-sm">
              {/* Phone Frame */}
              <div className={`relative ${isDarkMode ? 'bg-gradient-to-br from-[#1C1C28] to-[#2A2A38] border-[#0A0A0F]' : 'bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB] border-[#9CA3AF]'} rounded-[2.5rem] sm:rounded-[3.5rem] p-2 sm:p-3 shadow-2xl border-[8px] sm:border-[10px]`}>
                {/* Phone Notch */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-5 sm:h-7 ${isDarkMode ? 'bg-[#0A0A0F]' : 'bg-[#9CA3AF]'} rounded-b-2xl sm:rounded-b-3xl z-10`} />

                {/* Screen */}
                <div className={`${isDarkMode ? 'bg-[#000000]' : 'bg-white'} rounded-[2rem] sm:rounded-[2.75rem] overflow-hidden relative transition-colors duration-300`}>
                  {/* Status Bar */}
                  <div className={`flex items-center justify-between px-4 sm:px-6 pt-2 sm:pt-3 pb-1 sm:pb-2 ${isDarkMode ? 'text-white' : 'text-black'} text-[10px] sm:text-xs`}>
                    <span className="font-semibold">12:41</span>
                    <div className="flex items-center gap-1">
                      {/* Battery Icon */}
                      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className={isDarkMode ? 'text-white' : 'text-black'}>
                        <rect x="1" y="2" width="18" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <rect x="3" y="4" width="14" height="4" rx="0.5" fill="currentColor" />
                        <rect x="20" y="4.5" width="2" height="3" rx="0.5" fill="currentColor" />
                      </svg>
                    </div>
                  </div>

                  {/* Instagram Header */}
                  <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} transition-colors duration-300`}>
                    <button className={isDarkMode ? 'text-white' : 'text-black'}>
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <div className="flex-1 text-center">
                      <p className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold text-[10px] sm:text-sm`}>{currentDate}</p>
                      <p className={`${isDarkMode ? 'text-white' : 'text-black'} font-bold text-sm sm:text-base`}>KANVA</p>
                    </div>
                    <div className="w-5 sm:w-6" />
                  </div>

                  {/* Post Image - Dynamic */}
                  <div
                    className={`aspect-[4/5] ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'} flex items-center justify-center transition-all duration-500 ${
                      isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    } relative`}
                    style={currentPost.backgroundImage ? {
                      backgroundImage: `url(${currentPost.backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    {/* Sport Label */}
                    <div className="absolute top-4 sm:top-8 left-4 sm:left-8">
                      <span className={`${isDarkMode ? 'bg-white/20 text-white' : 'bg-black/10 text-black'} px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm`}>
                        {currentPost.sport}
                      </span>
                    </div>

                    {/* Score Display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="text-white px-4 sm:px-8 py-3 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-3xl sm:text-6xl flex items-center gap-2 sm:gap-4"
                        style={{ backgroundColor: currentPost.colorTeam }}
                      >
                        <span>{currentPost.scoreTeam}</span>
                        <span className="text-2xl sm:text-4xl">-</span>
                        <span
                          className="px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl"
                          style={{ backgroundColor: currentPost.colorOpponent }}
                        >
                          {currentPost.scoreOpponent}
                        </span>
                      </div>
                    </div>

                    {/* Team Names */}
                    <div className={`absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 flex justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'} text-[10px] sm:text-sm font-semibold`}>
                      <span className="truncate max-w-[40%]">{currentPost.team}</span>
                      <span className="truncate max-w-[40%]">{currentPost.opponent}</span>
                    </div>

                    {/* Background Image Effect */}
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/20' : 'bg-white/10'}`} />
                  </div>

                  {/* Instagram Actions */}
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} transition-colors duration-300`}>
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                      <button className={currentPost.id === 1 ? 'text-red-500' : (isDarkMode ? 'text-white' : 'text-black')}>
                        <svg 
                          width="20" 
                          height="20"
                          className="sm:w-6 sm:h-6" 
                          fill={currentPost.id === 1 ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button className={isDarkMode ? 'text-white' : 'text-black'}>
                        <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </button>
                      <button className={isDarkMode ? 'text-white' : 'text-black'}>
                        <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                      <button className={`${isDarkMode ? 'text-white' : 'text-black'} ml-auto`}>
                        <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>

                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-xs sm:text-sm mb-0.5 sm:mb-1`}>
                      <span className="font-semibold">{currentPost.likes} Likes</span>
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-xs sm:text-sm`}>
                      <span className="font-semibold">KANVA</span> {currentPost.caption}
                    </p>
                    <p className="text-gray-500 text-xs mt-1"></p>
                  </div>

                  {/* Bottom Navigation */}
                  <div className={`flex items-center justify-around px-3 sm:px-4 py-3 sm:py-4 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} transition-colors duration-300`}>
                    <button className={isDarkMode ? 'text-white' : 'text-black'}>
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>
                    <button className="text-gray-500">
                      <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
