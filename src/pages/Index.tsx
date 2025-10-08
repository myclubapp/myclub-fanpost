import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Zap, Image, Share2, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
            <Button size="lg" variant="outline" onClick={() => navigate('/about')}>
              Mehr erfahren
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
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
