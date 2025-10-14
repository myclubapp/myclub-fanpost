import { useLanguage } from "@/contexts/LanguageContext";

export const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="container mx-auto px-4 py-32">
      <div className="max-w-4xl">
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
          {t.about.title}
        </h2>
        <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed">
          {t.about.description}
        </p>
      </div>
    </section>
  );
};
