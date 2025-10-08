import { User, Crown, Coins, Settings, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";

const menuItems = [
  { title: "Profil", url: "/profile", icon: User },
  { title: "Abonnement", url: "/profile/subscription", icon: Crown },
  { title: "Credits", url: "/profile/credits", icon: Coins },
  { title: "Einstellungen", url: "/profile/settings", icon: Settings },
  { title: "Account löschen", url: "/profile/delete", icon: Trash2 },
];

export function ProfileSidebar() {
  return (
    <Card className="p-4">
      <nav className="space-y-1">
        {menuItems.map((item) => (
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
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </Card>
  );
}
