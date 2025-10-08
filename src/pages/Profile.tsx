import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCredits } from '@/hooks/useCredits';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Crown, Sparkles, Coins, CreditCard, ArrowUpCircle, ArrowDownCircle, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

const profileSchema = z.object({
  first_name: z.string().max(100, 'Vorname zu lang').optional(),
  last_name: z.string().max(100, 'Nachname zu lang').optional(),
});

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isPaidUser } = useUserRole();
  const { credits, loading: creditsLoading } = useCredits();
  const { subscription, loading: subscriptionLoading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rememberLastSelection, setRememberLastSelection] = useState(true);
  const [lastSport, setLastSport] = useState<string>('');
  const [lastClubName, setLastClubName] = useState<string>('');
  const [lastTeamName, setLastTeamName] = useState<string>('');
  const [loadingLastSelection, setLoadingLastSelection] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTransactions();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, remember_last_selection, last_sport, last_club_id, last_team_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setRememberLastSelection(data.remember_last_selection ?? true);
        
        // Load last selection details
        if (data.last_sport) {
          const sportLabels: Record<string, string> = {
            unihockey: 'Unihockey',
            volleyball: 'Volleyball',
            handball: 'Handball'
          };
          setLastSport(sportLabels[data.last_sport] || data.last_sport);
        }
        
        // Load club and team names
        if (data.last_club_id || data.last_team_id) {
          loadLastSelectionNames(data.last_sport, data.last_club_id, data.last_team_id);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const loadLastSelectionNames = async (sport: string | null, clubId: string | null, teamId: string | null) => {
    if (!sport || !clubId) return;
    
    setLoadingLastSelection(true);
    try {
      // Load club name
      const apiUrls: Record<string, string> = {
        unihockey: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20clubs{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%20%0A}",
        volleyball: "",
        handball: "",
      };

      const clubApiUrl = apiUrls[sport];
      if (clubApiUrl) {
        const response = await fetch(clubApiUrl);
        const data = await response.json();
        const clubs = data.data?.clubs || [];
        const club = clubs.find((c: { id: string, name: string }) => c.id === clubId);
        if (club) {
          setLastClubName(club.name);
        }
      }

      // Load team name if available
      if (teamId) {
        const teamApiUrls: Record<string, (clubId: string) => string> = {
          unihockey: (clubId: string) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%0A}%0A`,
          volleyball: () => "",
          handball: () => "",
        };

        const teamApiUrl = teamApiUrls[sport]?.(clubId);
        if (teamApiUrl) {
          const response = await fetch(teamApiUrl);
          const data = await response.json();
          const teams = data.data?.teams || [];
          const team = teams.find((t: { id: string, name: string }) => t.id === teamId);
          if (team) {
            setLastTeamName(team.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading last selection names:', error);
    } finally {
      setLoadingLastSelection(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setTransactionsLoading(true);
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'monthly_reset':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'purchase':
        return <ShoppingBag className="h-4 w-4 text-green-500" />;
      case 'consumption':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'subscription_grant':
        return <ArrowUpCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Bestätigung fehlgeschlagen",
        description: "Bitte geben Sie 'DELETE' ein, um fortzufahren.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Nicht angemeldet');
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteConfirmation },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account gelöscht",
        description: "Ihr Account und alle Daten wurden erfolgreich gelöscht.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Fehler",
        description: error.message || "Account konnte nicht gelöscht werden",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    setErrors({});
    const validation = profileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
    });

    if (!validation.success) {
      const newErrors: { [key: string]: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          remember_last_selection: rememberLastSelection,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update display name in auth
      const displayName = [firstName, lastName].filter(Boolean).join(' ');
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName || null,
        }
      });

      if (authError) throw authError;

      toast({
        title: "Profil aktualisiert",
        description: "Ihre Änderungen wurden gespeichert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createCheckout();
      if (url) {
        window.open(url, '_blank');
        toast({
          title: "Checkout geöffnet",
          description: "Schließen Sie den Kaufvorgang ab, um zu Pro zu upgraden.",
        });
      } else {
        throw new Error('Checkout URL konnte nicht erstellt werden');
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Portal URL konnte nicht erstellt werden');
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Zahlung erfolgreich",
        description: "Willkommen bei Pro! Ihre Subscription wird in Kürze aktiviert.",
      });
      checkSubscription();
      window.history.replaceState({}, '', '/profile');
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Zahlung abgebrochen",
        description: "Sie können jederzeit upgraden.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  if (authLoading || roleLoading || !user) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mein Profil</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre persönlichen Informationen
            </p>
          </div>

          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihre persönlichen Daten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Die E-Mail-Adresse kann nicht geändert werden
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Max"
                    className={errors.first_name ? 'border-destructive' : ''}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Mustermann"
                    className={errors.last_name ? 'border-destructive' : ''}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Wizard-Einstellungen</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-selection" 
                      checked={rememberLastSelection}
                      onCheckedChange={(checked) => setRememberLastSelection(checked as boolean)}
                    />
                    <Label htmlFor="remember-selection" className="text-sm cursor-pointer">
                      Letzte Auswahl merken
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Wenn aktiviert, wird Ihre letzte Club- und Teamauswahl im Wizard gespeichert.
                  </p>
                  
                  {rememberLastSelection && (lastSport || lastClubName || lastTeamName) && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Gespeicherte Auswahl:</p>
                      {loadingLastSelection ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Lade...
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          {lastSport && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Sportart:</span>
                              <span className="font-medium">{lastSport}</span>
                            </div>
                          )}
                          {lastClubName && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Club:</span>
                              <span className="font-medium">{lastClubName}</span>
                            </div>
                          )}
                          {lastTeamName && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Team:</span>
                              <span className="font-medium">{lastTeamName}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Profil speichern
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isPaidUser ? (
                      <>
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Pro Account
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        Free Account
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isPaidUser
                      ? 'Sie haben Zugriff auf alle Pro-Features'
                      : 'Upgraden Sie für unbegrenzte Möglichkeiten'}
                  </CardDescription>
                </div>
                <Badge
                  variant={isPaidUser ? 'default' : 'secondary'}
                  className={isPaidUser ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  {role === 'admin' ? 'Admin' : isPaidUser ? 'Paid' : 'Free'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credits Display */}
              {credits && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Verfügbare Credits</h4>
                    </div>
                    <span className="text-2xl font-bold text-primary">{credits.credits_remaining}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPaidUser 
                      ? 'Sie erhalten 10 Credits pro Monat' 
                      : 'Sie erhalten 3 Credits pro Monat'}
                  </p>
                  {credits.credits_purchased > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Inkl. {credits.credits_purchased} gekaufte Credits
                    </p>
                  )}
                </div>
              )}

              {!isPaidUser && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Upgrade zu Pro</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Erstellen Sie eigene Templates, erhalten Sie 10 Credits pro Monat und nutzen Sie erweiterte Funktionen.
                      </p>
                      <p className="text-lg font-bold text-primary mb-3">
                        Nur CHF 9.- / Monat
                      </p>
                      <Button size="sm" onClick={handleUpgrade} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Jetzt upgraden
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isPaidUser && subscription?.subscribed && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Abo verwalten</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.subscription_end && 
                        `Verlängert sich am ${new Date(subscription.subscription_end).toLocaleDateString('de-CH')}`
                      }
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleManageSubscription} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Stripe Dashboard öffnen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Transactions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Credit-Historie
              </CardTitle>
              <CardDescription>
                Ihre letzten Credit-Transaktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Transaktionen vorhanden
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            transaction.amount > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                        </span>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Gefahrenzone
              </CardTitle>
              <CardDescription>
                Unwiderrufliche Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">Profil löschen</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Das Löschen Ihres Profils ist dauerhaft und kann nicht rückgängig gemacht werden. 
                  Alle Ihre Daten, Templates und Credits gehen unwiderruflich verloren.
                </p>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Profil löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sind Sie absolut sicher?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Ihr Account und alle zugehörigen Daten werden dauerhaft gelöscht:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Alle persönlichen Daten</li>
                          <li>Alle erstellten Templates</li>
                          <li>Alle Credits und Transaktionen</li>
                          <li>Ihre Subscription (falls vorhanden)</li>
                        </ul>
                        <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                          <p className="font-semibold text-sm mb-2">
                            Bitte geben Sie <span className="font-mono bg-background px-1">DELETE</span> ein, um zu bestätigen:
                          </p>
                          <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE"
                            className="font-mono"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                        Abbrechen
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE' || deleting}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Wird gelöscht...
                          </>
                        ) : (
                          'Account endgültig löschen'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
