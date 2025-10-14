import { useEffect, useRef } from "react";

const examplePosts = [
  {
    id: 1,
    gradient: "from-blue-500 to-cyan-500",
    sport: "Unihockey",
    text: "5:3 Sieg!",
    emoji: "🏒",
    hashtags: "#Unihockey #TeamSpirit"
  },
  {
    id: 2,
    gradient: "from-purple-500 to-pink-500",
    sport: "Volleyball",
    text: "3:1 Sets",
    emoji: "🏐",
    hashtags: "#Volleyball #Victory"
  },
  {
    id: 3,
    gradient: "from-orange-500 to-red-500",
    sport: "Handball",
    text: "28:24",
    emoji: "🤾",
    hashtags: "#Handball #Passion"
  },
  {
    id: 4,
    gradient: "from-green-500 to-teal-500",
    sport: "Unihockey",
    text: "MVP: Jonas",
    emoji: "⭐",
    hashtags: "#StarPlayer"
  },
  {
    id: 5,
    gradient: "from-yellow-500 to-orange-500",
    sport: "Volleyball",
    text: "Derby!",
    emoji: "🔥",
    hashtags: "#LocalDerby"
  },
  {
    id: 6,
    gradient: "from-pink-500 to-purple-500",
    sport: "Handball",
    text: "Aufstieg!",
    emoji: "🎉",
    hashtags: "#Champions"
  }
];

export const EmotionStrip = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    let scrollAmount = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollAmount += scrollSpeed;
      if (scrollElement) {
        scrollElement.scrollLeft = scrollAmount;
        
        // Reset scroll when reaching end
        if (scrollAmount >= scrollElement.scrollWidth / 2) {
          scrollAmount = 0;
        }
      }
    };

    const intervalId = setInterval(scroll, 20);

    return () => clearInterval(intervalId);
  }, []);

  // Duplicate posts for infinite scroll effect
  const duplicatedPosts = [...examplePosts, ...examplePosts];

  return (
    <section className="py-20 bg-gradient-to-r from-background via-muted/30 to-background overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Poste den Sieg, teile die Leidenschaft
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Echte Emotionen, echte Teams, echte Ergebnisse – automatisch in perfekte Posts verwandelt
          </p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-hidden pb-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedPosts.map((post, index) => (
          <div
            key={`${post.id}-${index}`}
            className="flex-shrink-0 w-72 group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              {/* Post Card */}
              <div className={`aspect-square bg-gradient-to-br ${post.gradient} p-6 flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-semibold text-sm">
                      {post.sport}
                    </span>
                  </div>
                  <span className="text-5xl">{post.emoji}</span>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">
                      {post.text}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <span className="text-white font-medium">Team Logo</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">❤️</span>
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📤</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-white/90 text-sm font-medium">
                      {post.hashtags}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                  <p className="text-2xl font-bold">Erstellt in 10 Sek</p>
                  <p className="text-sm">Mit KANVA</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </section>
  );
};