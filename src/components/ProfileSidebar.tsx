import { User, Crown, Users, Image, Settings, Trash2, FileText, ImageIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

const menuItems = [
  { title: "Profil", url: "/profile", icon: User },
  { title: "Abonnement", url: "/profile/subscription", icon: Crown },
  { title: "Meine Teams", url: "/profile/teams", icon: Users },
  { title: "Vorlagen", url: "/profile/templates", icon: FileText },
  { title: "Logos und Bilder", url: "/profile/logos", icon: Image },
  { title: "Hintergrundbilder", url: "/profile/backgrounds", icon: ImageIcon },
  { title: "Einstellungen", url: "/profile/settings", icon: Settings },
  { title: "Account löschen", url: "/profile/delete", icon: Trash2 },
];

export function ProfileSidebar() {
  const { tier } = useSubscription();
  
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
