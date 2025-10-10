import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">FanPost</h3>
            <p className="text-muted-foreground mb-4">
              Aus Emotionen werden Posts. Social Media für Sportvereine, die wieder Freude macht.
              <br />
              Digital. Einfach. Leidenschaftlich.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/myclubthenextgeneration" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://twitter.com/my_club_app" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://www.instagram.com/p/CD2LeTkJisD/" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
            </div>
            {/* Swiss Made Software Logo */}
            <div className="mt-6">
              <a href="https://www.swissmadesoftware.org/companies/liitu-consulting-gmbh/home.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                <img src="/swiss-made-software.png" alt="swiss made software" className="h-10 mr-2" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Produkt</h3>
            <ul className="space-y-3">
              <li><a href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">Funktionen</a></li>
              <li><a href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">Preise</a></li>
              <li><a href="/#about" className="text-muted-foreground hover:text-primary transition-colors">Über uns</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Soziale Medien</h3>
            <ul className="space-y-3">
              <li><a href="https://github.com/myclubapp" className="text-muted-foreground hover:text-primary transition-colors">GitHub</a></li>
              <li><a href="https://twitter.com/my_club_app" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a></li>
              <li><a href="https://www.instagram.com/p/CD2LeTkJisD/" className="text-muted-foreground hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="https://www.facebook.com/myclubthenextgeneration" className="text-muted-foreground hover:text-primary transition-colors">Facebook</a></li>
              <li><a href="https://www.linkedin.com/company/myclub-thenextgeneration/" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Privatsphäre</h3>
            <ul className="space-y-3">
              <li><Link to="/impressum" className="text-muted-foreground hover:text-primary transition-colors">Impressum</Link></li>
              <li><Link to="/privacy-policy-de" className="text-muted-foreground hover:text-primary transition-colors">Datenschutz</Link></li>
              <li><Link to="/terms-and-conditions-de" className="text-muted-foreground hover:text-primary transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} FanPost. Alle Rechte vorbehalten.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-6 text-sm">
              <Link to="/impressum" className="text-muted-foreground hover:text-primary transition-colors">Impressum</Link>
              <span className="text-muted-foreground hidden md:inline">|</span>
              <Link to="/privacy-policy-de" className="text-muted-foreground hover:text-primary transition-colors">Datenschutz</Link>
              <Link to="/terms-and-conditions-de" className="text-muted-foreground hover:text-primary transition-colors">AGB</Link>
              <span className="text-muted-foreground hidden md:inline">|</span>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;