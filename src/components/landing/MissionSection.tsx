import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Trophy, Mail, Users, Target } from "lucide-react";

export const MissionSection = () => {
  return (
    <section id="about" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Mission Statement */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">
            Wir glauben an jeden Verein
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Jedes Team kann seine Fans begeistern – auch ohne Profi-Marketing.
            <br />
            <span className="text-foreground font-semibold">
              Darum haben wir FanPost entwickelt.
            </span>
          </p>
        </div>

        {/* Story Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Unsere Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Wir sind selbst Sportfans und kennen die Herausforderung: Nach dem Spiel 
                soll schnell ein Post online sein – aber wer hat Zeit für Design?
              </p>
              <p className="text-foreground font-medium text-lg">
                FanPost macht professionelle Social-Media-Posts für jeden zugänglich. 
                Automatisch. In Sekunden. Ohne Vorkenntnisse.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent/50">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Was wir bieten</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Direkte Integration mit Schweizer Sportverbänden. Wähle dein Spiel aus, 
                und alle Daten sind schon da: Teams, Logos, Ergebnisse.
              </p>
              <p className="text-foreground font-medium text-lg">
                Du musst nichts mehr manuell eingeben. Der Post wird automatisch generiert – 
                ready to share auf Instagram, Facebook und Co.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Sports */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Unterstützte Sportarten</CardTitle>
            </div>
            <p className="text-muted-foreground text-lg">
              Aktuell für die drei beliebtesten Hallen-Sportarten der Schweiz
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  sport: "Unihockey",
                  federation: "Swiss Unihockey",
                  emoji: "🏒",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  sport: "Volleyball",
                  federation: "Swiss Volley",
                  emoji: "🏐",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  sport: "Handball",
                  federation: "Swiss Handball",
                  emoji: "🤾",
                  gradient: "from-orange-500 to-red-500"
                }
              ].map((item) => (
                <div 
                  key={item.sport}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative p-6 space-y-4">
                    <div className="text-6xl">{item.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{item.sport}</h3>
                      <p className="text-sm text-muted-foreground">{item.federation}</p>
                    </div>
                    <div className={`w-full h-1 rounded-full bg-gradient-to-r ${item.gradient}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Behind */}
        <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-accent to-primary">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Das Team dahinter</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Wir sind ein kleines Team aus Sportbegeisterten und Tech-Enthusiasten aus der Schweiz. 
              Unser Ziel: Social Media für Sportvereine so einfach wie möglich machen.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                🇨🇭 Made in Switzerland
              </div>
              <div className="px-4 py-2 rounded-full bg-accent/10 text-accent font-medium">
                ⚡ Built for Teams
              </div>
              <div className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                ❤️ With Passion
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-accent/10 text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl mb-4">Fragen? Feedback? Ideen?</CardTitle>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Wir freuen uns, von dir zu hören! Gemeinsam machen wir FanPost noch besser.
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = 'mailto:hello@fanpost.ch'}
            >
              <Mail className="h-5 w-5 mr-2" />
              Kontakt aufnehmen
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};