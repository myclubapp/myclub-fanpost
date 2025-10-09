import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Zap, Image, Share2, Sparkles, Trophy, Mail } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-16">{/* pt-16 für fixed header */}
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Social Media Posts für dein Team in Sekunden
          </h1>
          <p className="text-xl text-muted-foreground">
            Erstelle professionelle Social Media Posts für deine Spiele mit nur wenigen Klicks. 
            Perfekt für Schweizer Sportvereine.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/wizard')}>
              Jetzt starten
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
              Mehr erfahren
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Warum FanPost?
          </h2>
          <p className="text-lg text-muted-foreground">
            Alles was du brauchst, um deine Fans zu begeistern
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Blitzschnell</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erstelle Posts in wenigen Sekunden. Wähle dein Spiel und lade den fertigen Post herunter.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Image className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Professionell</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Hochwertige Templates, die speziell für Sportvereine entwickelt wurden.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Anpassbar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erstelle eigene Templates und passe sie an dein Team-Branding an.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Share2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Direkt teilen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Exportiere deine Posts und teile sie direkt auf Social Media.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            So einfach geht's
          </h2>
          <p className="text-lg text-muted-foreground">
            In 4 Schritten zu deinem perfekten Social Media Post
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold">Sportart wählen</h3>
            <p className="text-muted-foreground">
              Wähle zwischen Unihockey, Volleyball und Handball
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold">Club auswählen</h3>
            <p className="text-muted-foreground">
              Finde deinen Club in unserer Datenbank
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold">Team wählen</h3>
            <p className="text-muted-foreground">
              Wähle dein Team aus der Liste
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              4
            </div>
            <h3 className="text-xl font-semibold">Post erstellen</h3>
            <p className="text-muted-foreground">
              Wähle ein Spiel und erstelle deinen Post
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" onClick={() => navigate('/wizard')}>
            Jetzt loslegen
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Preise
          </h2>
          <p className="text-lg text-muted-foreground">
            Wähle das passende Paket für dein Team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Für Einsteiger</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">CHF 0</span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>3 Credits pro Monat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Basis Posts erstellen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Standard Templates</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate('/wizard')}>
                Starten
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Für aktive Teams</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">CHF 9</span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>10 Credits pro Monat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Alle Free Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Eigene Templates erstellen</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Upgrade
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Für Vereine</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Unbegrenzte Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Alle Pro Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Kontakt
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Über uns
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Social Media Posts für Schweizer Sportvereine
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  Unsere Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  FanPost hilft Schweizer Sportvereinen, professionelle Social Media Posts 
                  für ihre Spiele zu erstellen. Wir glauben, dass jedes Team die Möglichkeit 
                  haben sollte, seine Fans mit ansprechenden Inhalten zu erreichen.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  Was wir bieten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Mit FanPost kannst du in wenigen Schritten ansprechende Social Media Posts 
                  für deine Spiele erstellen. Wähle einfach deine Sportart, deinen Club, 
                  dein Team und das Spiel aus - den Rest erledigen wir für dich.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                Unterstützte Sportarten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">U</span>
                    </div>
                    <span className="font-medium">Unihockey</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Swiss Unihockey</span>
                </div>
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">V</span>
                    </div>
                    <span className="font-medium">Volleyball</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Swiss Volley</span>
                </div>
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">H</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Handball</span>
                      <Badge variant="secondary" className="text-xs w-fit mt-1">Coming soon</Badge>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Swiss Handball</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                Kontakt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Hast du Fragen oder Feedback? Wir freuen uns, von dir zu hören!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Bereit für professionelle Social Media Posts?
          </h2>
          <p className="text-xl text-muted-foreground">
            Starte jetzt kostenlos und erstelle deinen ersten Post in Sekunden
          </p>
          <Button size="lg" onClick={() => navigate('/wizard')}>
            Kostenlos starten
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
