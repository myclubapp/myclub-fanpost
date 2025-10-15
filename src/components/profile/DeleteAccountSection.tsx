import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

export const DeleteAccountSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  return (
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
            Alle Ihre Daten, Templates und Abonnements gehen unwiderruflich verloren.
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
                    <li>Alle Team-Slots</li>
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
  );
};
