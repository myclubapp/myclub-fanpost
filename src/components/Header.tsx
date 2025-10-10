import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/components/theme-provider';
import { LogOut, User, FileText, Coins, Menu, X, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from '@/assets/myclub-logo.png';

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const { isPaidUser } = useUserRole();
  const { credits } = useCredits();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevCredits, setPrevCredits] = useState<number | null>(null);
  const [showPop, setShowPop] = useState(false);

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

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const section = path.split('#')[1];
      if (window.location.pathname === '/') {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(path);
    }
  };

  // Pop effect when credits change (decrease)
  useEffect(() => {
    if (credits && prevCredits !== null) {
      if (credits.credits_remaining < prevCredits) {
        setShowPop(true);
        setTimeout(() => setShowPop(false), 600);
      }
    }
    if (credits) {
      setPrevCredits(credits.credits_remaining);
    }
  }, [credits?.credits_remaining]);


  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-md' 
          : 'bg-background/60 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={handleLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="MyClub Logo" className="h-8 w-auto" />
          <span className="font-bold text-xl">FanPost</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
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
            </NavigationMenuList>
          </NavigationMenu>

          {!loading && (
            <>
              {user ? (
                <>
                  {credits && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary ${showPop ? 'animate-blob' : ''}`}>
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
                      <DropdownMenuItem onClick={() => navigate('/templates')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Vorlagen
                        {!isPaidUser && (
                          <Badge variant="secondary" className="ml-auto">Pro</Badge>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Abmelden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                  <Button asChild variant="default">
                    <Link to="/auth">Login</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {!loading && user && credits && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary ${showPop ? 'animate-blob' : ''}`}>
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{credits.credits_remaining}</span>
            </div>
          )}
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left">Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/wizard')}
                >
                  Wizard
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/#pricing')}
                >
                  Preise
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/#about')}
                >
                  Über uns
                </Button>
                
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <div className="border-t pt-4 space-y-2">
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => handleNavigate('/profile')}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Mein Profil
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => handleNavigate('/templates')}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Vorlagen
                            {!isPaidUser && (
                              <Badge variant="secondary" className="ml-auto">Pro</Badge>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start w-full text-destructive"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              handleSignOut();
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Abmelden
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start w-full"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="mr-2 h-4 w-4" />
                              Hell
                            </>
                          ) : (
                            <>
                              <Moon className="mr-2 h-4 w-4" />
                              Dunkel
                            </>
                          )}
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() => handleNavigate('/auth')}
                        >
                          Login
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
