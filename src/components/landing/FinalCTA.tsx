import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-primary via-accent to-primary p-1 rounded-3xl shadow-2xl">
          <div className="bg-background rounded-3xl p-8 md:p-16 text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent animate-float shadow-lg">
                <Zap className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Bereit für Anpfiff?
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Erstelle deinen ersten professionellen Social-Media-Post in weniger als 30 Sekunden. 
                <span className="text-foreground font-semibold block mt-2">
                  Kostenlos. Ohne Registrierung. Jetzt sofort.
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg"
                className="text-xl px-10 py-7 shadow-[var(--shadow-glow)] hover:scale-105 transition-transform group"
                onClick={() => navigate('/wizard')}
              >
                Jetzt kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-xl px-10 py-7"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Wie funktioniert's?
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-border">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Keine Kreditkarte nötig</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>3 Posts gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Sofort einsatzbereit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};