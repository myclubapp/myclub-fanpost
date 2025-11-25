import { User, Crown, Users, Image, Settings, Trash2, FileText, ImageIcon, Mail } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProfileSidebar() {
  const { tier } = useSubscription();
  const { t } = useLanguage();

  const menuItems = [
    { title: t.profile.sidebar.profile, url: "/profile", icon: User },
    { title: t.profile.sidebar.subscription, url: "/profile/subscription", icon: Crown },
    { title: t.profile.sidebar.teams, url: "/profile/teams", icon: Users },
    { title: t.profile.sidebar.emailPreferences, url: "/profile/email-preferences", icon: Mail },
    { title: t.profile.sidebar.templates, url: "/profile/templates", icon: FileText },
    { title: t.profile.sidebar.logos, url: "/profile/logos", icon: Image },
    { title: t.profile.sidebar.backgrounds, url: "/profile/backgrounds", icon: ImageIcon },
    { title: t.profile.sidebar.settings, url: "/profile/settings", icon: Settings },
    { title: t.profile.sidebar.deleteAccount, url: "/profile/delete", icon: Trash2 },
  ];
  
  return (
    <Card className="p-4">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/profile"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </Card>
  );
}
