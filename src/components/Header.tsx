import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { LogOut, User, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from '@/assets/myclub-logo.png';

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const { isPaidUser } = useUserRole();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="MyClub Logo" className="h-8 w-auto" />
          <span className="font-bold text-xl">Fanpost</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {!loading && (
            <>
              {user ? (
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
                    {isPaidUser && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/templates')}>
                          <FileText className="mr-2 h-4 w-4" />
                          Meine Templates
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
