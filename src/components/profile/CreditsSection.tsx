import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Coins, RefreshCw, ShoppingBag, ArrowDownCircle, ArrowUpCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  game_url: string | null;
  template_info: string | null;
}

export const CreditsSection = () => {
  const { user } = useAuth();
  const { isPaidUser } = useUserRole();
  const { credits } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setTransactionsLoading(true);
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, description, created_at, game_url, template_info')
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
      case 'subscription_activated':
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

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Verfügbare Credits
          </CardTitle>
          <CardDescription>
            Ihre aktuelle Credit-Balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credits && (
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Coins className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Guthaben</p>
                    <p className="text-3xl font-bold text-primary">{credits.credits_remaining}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {isPaidUser 
                    ? 'Sie erhalten 10 Credits pro Monat' 
                    : 'Sie erhalten 3 Credits pro Monat'}
                </p>
                {credits.credits_purchased > 0 && (
                  <p>
                    Inkl. {credits.credits_purchased} gekaufte Credits
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Transactions */}
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
                  className="flex flex-col p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2"
                >
                  <div className="flex items-center justify-between">
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
                  
                  {/* Show game URL and template info for consumption transactions */}
                  {transaction.transaction_type === 'consumption' && (transaction.game_url || transaction.template_info) && (
                    <div className="pl-7 flex flex-wrap gap-3 text-xs border-t pt-2 mt-1">
                      {transaction.game_url && (
                        <Link 
                          to={transaction.game_url} 
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Spiel ansehen
                        </Link>
                      )}
                      {transaction.template_info && (
                        <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {transaction.template_info.startsWith('template=') 
                            ? `Custom Template` 
                            : transaction.template_info.replace('theme=', 'Theme: ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
