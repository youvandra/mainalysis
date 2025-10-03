import { supabase, getWalletAddress, getAccountId } from './supabase';

export interface DomainHistoryItem {
  id: string;
  domain_name: string;
  price: string;
  analyzed_at: string;
  account_id: string;
  created_at: string;
}

class DomainStorage {
  private recentlyAdded = new Map<string, number>();

  async addDomain(domainName: string, price: string): Promise<void> {
    const walletAddress = getWalletAddress();

    if (!walletAddress) {
      return;
    }

    const accountId = await getAccountId();

    if (!accountId) {
      return;
    }

    const cacheKey = `${accountId}_${domainName}`;
    const now = Date.now();
    const lastAdded = this.recentlyAdded.get(cacheKey);

    if (lastAdded && now - lastAdded < 5000) {
      return;
    }

    this.recentlyAdded.set(cacheKey, now);

    const newItem = {
      domain_name: domainName,
      account_id: accountId,
      price: price,
      analyzed_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('domain_history')
          .insert(newItem);

      } catch (err) {
      }
    }
  }

  async getHistory(): Promise<DomainHistoryItem[]> {
    const walletAddress = getWalletAddress();

    if (!walletAddress) {
      return [];
    }

    const accountId = await getAccountId();

    if (!accountId) {
      return [];
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('domain_history')
          .select('*')
          .eq('account_id', accountId)
          .order('analyzed_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error loading from Supabase:', error);
          return [];
        }

        return data || [];
      } catch (err) {
        return [];
      }
    }

    return [];
  }
}

export const domainStorage = new DomainStorage();
