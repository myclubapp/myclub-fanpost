import { useLanguage } from "@/contexts/LanguageContext";

export const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: "01",
      title: t.howItWorks.step1.title,
      description: t.howItWorks.step1.description,
    },
    {
      number: "02",
      title: t.howItWorks.step2.title,
      description: t.howItWorks.step2.description,
    },
    {
      number: "03",
      title: t.howItWorks.step3.title,
      description: t.howItWorks.step3.description,
    },
  ];

  return (
    <section id="how-it-works" className="container mx-auto px-4 py-32 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground">
            {t.howItWorks.title}
          </h2>
          <p className="text-xl text-foreground/70">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/20 to-transparent -translate-x-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
