import { useEffect, useRef, useState } from "react";
import { Trophy, Search, Users, Zap } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Trophy,
    title: "Sportart wählen",
    description: "Unihockey, Volleyball oder Handball – wähle deine Leidenschaft",
    color: "from-blue-500 to-cyan-500"
  },
  {
    number: "2",
    icon: Search,
    title: "Club finden",
    description: "Finde deinen Verein in unserer Schweizer Datenbank",
    color: "from-purple-500 to-pink-500"
  },
  {
    number: "3",
    icon: Users,
    title: "Team auswählen",
    description: "Von U12 bis zur 1. Liga – alle Teams an einem Ort",
    color: "from-orange-500 to-red-500"
  },
  {
    number: "4",
    icon: Zap,
    title: "Post fertig!",
    description: "Automatisch generiert, perfekt formatiert, ready to share",
    color: "from-green-500 to-teal-500"
  }
];

export const FeatureTimeline = () => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps((prev) => [...new Set([...prev, index])]);
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how-it-works"
      ref={sectionRef} 
      className="container mx-auto px-4 py-20 relative"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            So einfach geht's
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Von der Spielauswahl zum perfekten Post in nur 4 Schritten
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary hidden md:block" />

            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isVisible = visibleSteps.includes(index);
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={`relative transition-all duration-700 ${
                      isVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className={`grid md:grid-cols-2 gap-8 items-center ${
                      isEven ? '' : 'md:grid-flow-dense'
                    }`}>
                      {/* Content */}
                      <div className={`${isEven ? 'md:text-right' : 'md:col-start-2'}`}>
                        <div className={`inline-block ${isEven ? 'md:float-right' : ''}`}>
                          <div className="space-y-3">
                            <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${step.color} p-4 rounded-2xl text-white shadow-lg`}>
                              <Icon className="h-8 w-8" />
                              <span className="text-2xl font-bold">{step.number}</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold">
                              {step.title}
                            </h3>
                            <p className="text-lg text-muted-foreground max-w-md">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Visual */}
                      <div className={`${isEven ? 'md:col-start-2' : 'md:col-start-1'}`}>
                        <div className={`relative ${isEven ? '' : 'md:ml-auto'} max-w-md`}>
                          <div className={`aspect-video rounded-2xl bg-gradient-to-br ${step.color} p-1 shadow-xl`}>
                            <div className="w-full h-full rounded-xl bg-background/95 backdrop-blur flex items-center justify-center">
                              <Icon className="h-24 w-24 text-muted-foreground/20" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Circle for Timeline */}
                    <div className="absolute left-8 md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${step.color} border-4 border-background shadow-lg transition-transform duration-500 ${
                        isVisible ? 'scale-100' : 'scale-0'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};