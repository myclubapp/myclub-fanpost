import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Impressum</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
            <p className="text-muted-foreground mb-4">
              KANVA<br />
              c/o liitu consulting gmbh<br />
              Villenstrasse 4<br />
              8200 Schaffhausen<br />
              Schweiz
            </p>
            <p className="text-muted-foreground mb-4">
              Telefon: +41 79 403 36 13<br />
              E-Mail: <a href="mailto:support@getkanva.io" className="text-primary hover:underline">support@getkanva.io</a>
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Handelsregistereintrag</h2>
            <p className="text-muted-foreground mb-4">
              Eingetragen im Handelsregister des Kantons Schaffhausen<br />
              Registernummer: CHE-178.036.243
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p className="text-muted-foreground mb-4">
              Umsatzsteuer-Identifikationsnummer<br />
              CHE-178.036.243
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt</h2>
            <p className="text-muted-foreground mb-4">
              Sandro Scalco (Geschäftsführer)<br />
              liitu consulting gmbh<br />
              Villenstrasse 4<br />
              8200 Schaffhausen<br />
              Schweiz
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

export default Impressum;