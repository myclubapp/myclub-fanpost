import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicyDe = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Datenschutzrichtlinie (Version Januar 2025)</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Einführung</h2>
            <p className="text-muted-foreground mb-4">
              Willkommen bei FanPost. Diese Datenschutzrichtlinie umreisst unsere Praktiken bezüglich der Sammlung, Nutzung und Offenlegung Ihrer Informationen, wenn Sie unsere App verwenden, sowie die damit verbundenen Wahlmöglichkeiten.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Sammlung und Nutzung von Informationen</h2>
            <p className="text-muted-foreground mb-4">
              Für ein besseres Erlebnis bei der Nutzung unserer App benötigen wir möglicherweise bestimmte persönlich identifizierbare Informationen von Ihnen, einschliesslich, aber nicht beschränkt auf Ihre E-Mail-Adresse, Vor- und Nachnamen. Die gesammelten Informationen werden zur Erstellung und Verwaltung von Social-Media-Posts für Ihr Sportteam verwendet.
            </p>
            
            <h3 className="text-xl font-semibold mb-2">a. Profilerstellung</h3>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground space-y-2">
              <li>
                <strong>Erforderliche Informationen:</strong> Zur Erstellung eines Kontos benötigen wir Ihre E-Mail-Adresse, Vor- und Nachnamen.
              </li>
              <li>
                <strong>Zusätzliche Informationen:</strong> Ihre Profilinformationen werden verwendet, um Ihre Erfahrung mit FanPost zu personalisieren.
              </li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-2">b. Datenhosting</h3>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground">
              <li>
                Ihre Daten werden in der Schweiz (Region Europa-West6) verarbeitet und gespeichert, um die Einhaltung der lokalen Datenschutz- und Datenschutzbestimmungen sicherzustellen.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Cookies sind Dateien mit einer kleinen Datenmenge, die üblicherweise als anonymer eindeutiger Identifikator verwendet werden. Diese werden von der von Ihnen besuchten Website an Ihren Browser gesendet und im internen Speicher Ihres Geräts gespeichert.
            </p>
            <p className="text-muted-foreground mb-4">
              Dieser Dienst verwendet "Cookies" explizit, um die Benutzererfahrung zu verbessern. Sie haben die Möglichkeit, diese Cookies entweder zu akzeptieren oder abzulehnen und zu wissen, wann ein Cookie an Ihr Gerät gesendet wird.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dienstleister</h2>
            <p className="text-muted-foreground mb-4">
              Wir können aus folgenden Gründen Drittunternehmen und Einzelpersonen beschäftigen:
            </p>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground space-y-2">
              <li>Um unseren Dienst zu erleichtern;</li>
              <li>Um den Dienst in unserem Namen bereitzustellen;</li>
              <li>Um dienstbezogene Dienste durchzuführen; oder</li>
              <li>Um uns bei der Analyse zu unterstützen, wie unser Dienst genutzt wird.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Sicherheit</h2>
            <p className="text-muted-foreground mb-4">
              Wir schätzen Ihr Vertrauen in die Bereitstellung Ihrer persönlichen Informationen und streben daher danach, kommerziell akzeptable Mittel zu deren Schutz zu verwenden. Denken Sie jedoch daran, dass keine Übertragungsmethode über das Internet oder elektronische Speichermethode zu 100% sicher und zuverlässig ist.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Links zu anderen Websites</h2>
            <p className="text-muted-foreground mb-4">
              Dieser Dienst kann Links zu anderen Websites enthalten. Wenn Sie auf einen Link eines Drittanbieters klicken, werden Sie zu dieser Website weitergeleitet. Beachten Sie, dass diese externen Websites nicht von uns betrieben werden.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Änderungen an dieser Datenschutzrichtlinie</h2>
            <p className="text-muted-foreground mb-4">
              Wir können unsere Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Daher wird Ihnen empfohlen, diese Seite regelmässig auf Änderungen zu überprüfen.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Kontaktieren Sie uns</h2>
            <p className="text-muted-foreground mb-4">
              Wenn Sie Fragen oder Vorschläge zu unserer Datenschutzrichtlinie haben, zögern Sie nicht, uns unter <a href="mailto:support@my-club.app" className="text-primary hover:underline">support@my-club.app</a> zu kontaktieren.
            </p>
          </section>
          
          <div className="mt-12">
            <Link to="/" className="text-primary hover:underline">Zurück zur Startseite</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyDe;