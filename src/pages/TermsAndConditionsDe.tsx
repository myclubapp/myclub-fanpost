import React from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const TermsAndConditionsDe = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Geschäftsbedingungen (Version Oktober 2025)</h1>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Einführung</h2>
              <p className="text-muted-foreground mb-4">
                Willkommen bei FanPost. Diese Nutzungsbedingungen ("Bedingungen") regeln Ihre Nutzung der FanPost-Website und Anwendung ("Dienst"). Durch den Zugriff auf oder die Nutzung unseres Dienstes erklären Sie sich mit diesen Bedingungen und unserer Datenschutzrichtlinie einverstanden.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Nutzung des Dienstes</h2>
              <p className="text-muted-foreground mb-2">a. Der Dienst ist für Benutzer gedacht, die mindestens 18 Jahre alt sind. Minderjährige Personen dürfen den Dienst nur in Absprache mit ihren gesetzlichen Erziehungsberechtigten nutzen.</p>
              <p className="text-muted-foreground mb-2">b. Sie dürfen den Dienst nur zu rechtmässigen Zwecken und in Übereinstimmung mit diesen Bedingungen nutzen.</p>
              <p className="text-muted-foreground mb-2">c. Jede Nutzung oder Zugriff durch Personen unter 18 Jahren ist verboten, es sei denn, dass die Nutzung in Absprache mit den gesetzlichen Erziehungsberechtigten erfolgt.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Konten</h2>
              <p className="text-muted-foreground mb-2">a. Um bestimmte Funktionen des Dienstes nutzen zu können, müssen Sie ein Konto erstellen.</p>
              <p className="text-muted-foreground mb-2">b. Sie sind verantwortlich für die Wahrung der Vertraulichkeit Ihrer Kontozugangsdaten.</p>
              <p className="text-muted-foreground mb-2">c. Sie erklären sich damit einverstanden, uns sofort zu informieren, wenn Sie von einer Verletzung der Sicherheit oder einer unbefugten Nutzung Ihres Kontos Kenntnis erlangen. Nutzen Sie dazu die E-Mail-Adresse <a href="mailto:support@my-club.app" className="text-primary hover:underline">support@my-club.app</a></p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Urheberrechte</h2>
              <p className="text-muted-foreground mb-2">a. Der Dienst und seine Originalinhalte, Funktionen und Funktionalität sind und bleiben das ausschliessliche Eigentum von FanPost und seinen Lizenzgebern.</p>
              <p className="text-muted-foreground mb-2">b. Sie dürfen keinen Teil unseres Dienstes oder der enthaltenen Software kopieren, modifizieren, verteilen, verkaufen oder vermieten.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Zahlungen und Abonnements</h2>
              <p className="text-muted-foreground mb-2">a. Einige Teile des Dienstes können gegen eine Gebühr bereitgestellt werden ("Abonnement(e)").</p>
              <p className="text-muted-foreground mb-2">b. Sie werden im Voraus auf wiederkehrender und periodischer Basis abgerechnet ("Abrechnungszyklus").</p>
              <p className="text-muted-foreground mb-2">c. Gebühren sind nicht erstattungsfähig, ausser wie gesetzlich vorgeschrieben.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Beendigung</h2>
              <p className="text-muted-foreground mb-2">Wir können Ihr Konto beenden oder aussetzen und den Zugriff auf den Dienst sofort sperren, ohne vorherige Ankündigung oder Haftung, nach unserem alleinigen Ermessen, aus jedem Grund und ohne Einschränkung.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Haftungsbeschränkung</h2>
              <p className="text-muted-foreground mb-2">In keinem Fall haften FanPost oder seine Direktoren, Mitarbeiter, Partner, Vertreter, Lieferanten oder verbundene Unternehmen für indirekte, zufällige, besondere, Folge- oder Strafschäden.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Anwendbares Recht</h2>
              <p className="text-muted-foreground mb-2">Diese Bedingungen unterliegen den Gesetzen der Schweiz und werden nach diesen ausgelegt, ohne Berücksichtigung ihrer Bestimmungen über Gesetzeskonflikte.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Änderungen der Bedingungen</h2>
              <p className="text-muted-foreground mb-2">Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern oder zu ersetzen. Bei wesentlichen Änderungen werden wir mindestens 30 Tage vor Inkrafttreten der neuen Bedingungen informieren.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Kontaktieren Sie uns</h2>
              <p className="text-muted-foreground mb-2">Wenn Sie Fragen zu diesen Bedingungen haben, kontaktieren Sie uns bitte unter <a href="mailto:support@my-club.app" className="text-primary hover:underline">support@my-club.app</a></p>
            </section>
            
            <div className="mt-12">
              <Link to="/" className="text-primary hover:underline">Zurück zur Startseite</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditionsDe;