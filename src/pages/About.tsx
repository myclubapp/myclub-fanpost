import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Über uns
            </h1>
            <p className="text-xl text-muted-foreground">
              Social Media Posts für Schweizer Sportvereine
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-lg dark:prose-invert max-w-none pt-6">
              <h2>Unsere Mission</h2>
              <p>
                FanPost hilft Schweizer Sportvereinen, professionelle Social Media Posts 
                für ihre Spiele zu erstellen. Wir glauben, dass jedes Team die Möglichkeit 
                haben sollte, seine Fans mit ansprechenden Inhalten zu erreichen.
              </p>

              <h2>Was wir bieten</h2>
              <p>
                Mit FanPost kannst du in wenigen Schritten ansprechende Social Media Posts 
                für deine Spiele erstellen. Wähle einfach deine Sportart, deinen Club, 
                dein Team und das Spiel aus - den Rest erledigen wir für dich.
              </p>

              <h2>Unterstützte Sportarten</h2>
              <ul>
                <li>Unihockey</li>
                <li>Volleyball</li>
                <li>Handball</li>
              </ul>

              <h2>Kontakt</h2>
              <p>
                Hast du Fragen oder Feedback? Wir freuen uns, von dir zu hören!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
