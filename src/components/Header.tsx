import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCredits } from '@/hooks/useCredits';
import { LogOut, User, FileText, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import logo from '@/assets/myclub-logo.png';

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const { isPaidUser } = useUserRole();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-md' 
          : 'bg-background/60 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="MyClub Logo" className="h-8 w-auto" />
          <span className="font-bold text-xl">Fanpost</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/wizard">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Wizard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a href="/#pricing" onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname === '/') {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#pricing');
                  }
                }}>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Preise
                  </NavigationMenuLink>
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a href="/#about" onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname === '/') {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#about');
                  }
                }}>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Über uns
                  </NavigationMenuLink>
                </a>
              </NavigationMenuItem>
              {!loading && user && (
                <NavigationMenuItem>
                  <Link to="/templates">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Vorlagen
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {!loading && (
            <>
              {user ? (
                <>
                  {/* Credits Display */}
                  {credits && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                      <Coins className="h-4 w-4" />
                      <span className="text-sm font-medium">{credits.credits_remaining}</span>
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Mein Profil
                      </DropdownMenuItem>
                      {isPaidUser && (
                        <DropdownMenuItem onClick={() => navigate('/templates')}>
                          <FileText className="mr-2 h-4 w-4" />
                          Meine Templates
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Abmelden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild variant="default">
                  <Link to="/auth">Login</Link>
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
