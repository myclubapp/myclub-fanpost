import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const DeleteAccountSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: t.profile.deleteAccount.confirmationFailed,
        description: t.profile.deleteAccount.confirmationFailedDescription,
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(t.profile.deleteAccount.notLoggedIn);
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteConfirmation },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: t.profile.deleteAccount.deleteSuccess,
        description: t.profile.deleteAccount.deleteSuccessDescription,
      });

      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: t.profile.deleteAccount.deleteError,
        description: error.message || t.profile.deleteAccount.deleteErrorDescription,
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
          {t.profile.deleteAccount.title}
        </CardTitle>
        <CardDescription>
          {t.profile.deleteAccount.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-destructive/10 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-destructive">{t.profile.deleteAccount.deleteProfile}</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t.profile.deleteAccount.deleteDescription}
          </p>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {t.profile.deleteAccount.deleteButton}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.profile.deleteAccount.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.profile.deleteAccount.confirmDescription}
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{t.profile.deleteAccount.confirmList.personalData}</li>
                    <li>{t.profile.deleteAccount.confirmList.templates}</li>
                    <li>{t.profile.deleteAccount.confirmList.teamSlots}</li>
                    <li>{t.profile.deleteAccount.confirmList.subscription}</li>
                  </ul>
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="font-semibold text-sm mb-2">
                      {t.profile.deleteAccount.confirmPrompt} <span className="font-mono bg-background px-1">{t.profile.deleteAccount.confirmPromptWord}</span> {t.profile.deleteAccount.confirmPromptEnd}
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
                  {t.profile.deleteAccount.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || deleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.profile.deleteAccount.deleting}
                    </>
                  ) : (
                    t.profile.deleteAccount.deleteAction
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
