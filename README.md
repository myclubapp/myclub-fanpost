## KANVA – Wo Emotionen zu Stories werden

Erstelle automatisch Social Media Posts aus deinen Spielen – schnell, authentisch und im Look deines Teams.

![KANVA logo](./src/assets/logo.png)

---

### Features

- **Sportarten**: Unihockey, Volleyball & Handball
- **Geführter Flow**: Sportart → Club → Team → Spielauswahl
- **Mehrfachauswahl**: Mehrere Spiele gleichzeitig auswählen
- **Automatische Vorschau**: Hochwertige Visualisierung mit `kanva-web-components`
- **Saubere URLs**: Teilbare Deep-Links inkl. Mehrfach-Spiel-IDs
- **UI-Komponenten**: Moderne Oberfläche mit shadcn-ui, Tailwind CSS und Radix UI

---

### Tech-Stack

- Build-Tool: Vite (React + TypeScript, SWC)
- UI: shadcn-ui, Radix UI, Tailwind CSS
- State & Data: React Query
- Routing: React Router v6
- Preview/Render: `kanva-web-components`

---

### Projektstruktur (Auszug)

- `src/pages/Index.tsx`: Haupt-Flow (Sport/Club/Team/Spiele, Vorschau)
- `src/App.tsx`: App-Shell, Routing, Provider
- `src/components/*`: Such- und Anzeige-Komponenten (Club, Team, Spiele, Preview)
- `src/components/ui/*`: shadcn-ui Komponenten

---

### Routen

- `/` – Einstieg, Sportart wählen
- `/:sport` – Clubsuche
- `/:sport/:clubId` – Teams des Clubs
- `/:sport/:clubId/:teamId` – Spiele des Teams
- `/:sport/:clubId/:teamId/:gameId` – Spielvorschau; mehrere `gameId`s mit Komma trennen, z. B. `abc,def,ghi`

Beispiel: `/unihockey/12345/67890/a1b2,a3b4`

---

### Lokale Entwicklung

Voraussetzungen: Node.js (empfohlen via nvm) und npm.

```bash
git clone <REPO_URL>
cd myclub-kanva
npm install
npm run dev
```

Standard-Dev-Server: Port 8080 (siehe `vite.config.ts`).

Nützliche Skripte:

- `npm run dev` – Entwicklungsserver starten
- `npm run build` – Produktion builden
- `npm run preview` – Produktionsbuild lokal serven
- `npm run lint` – Linting ausführen

---

### Datenquellen

- Club-/Team-/Spieldaten für Unihockey werden über eine Cloud-Function als GraphQL-ähnliche Abfrage geladen. Die URLs sind im Code hinterlegt (siehe `Index.tsx`). 

Hinweis: Netzwerkfehler werden geloggt, die UI bleibt bedienbar.

---

### Nutzung (Kurz)

1. Sportart wählen
2. Club suchen und wählen
3. Team wählen
4. Spiel(e) wählen – Mehrfachauswahl möglich
5. Vorschau ansehen und Bild exportieren/teilen

Deep-Linking: Die aktuelle Auswahl spiegelt sich in der URL wider und kann geteilt werden.

---

### Styling & Komponenten

- Tailwind Utilities und Design-Tokens (`bg-background`, `text-foreground`, usw.)
- shadcn-ui (z. B. `Card`, `RadioGroup`, `Badge`) und Radix UI als Basis
- Toast/Toaster sind integriert (`ui/toaster`, `ui/sonner`)

---

### Deployment

- Standard Vite-Setup eignet sich für statische Hosts oder Plattformen wie Vercel/Netlify.
- Prüfe Produktionsbuild lokal:

```bash
npm run build
npm run preview
```

---

### Lizenz

Falls nicht anders angegeben, proprietär. Bitte intern verwenden oder Lizenzhinweise ergänzen.
