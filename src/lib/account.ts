import { supabase } from './supabase';
import { walletManager } from './wallet';

export interface Account {
  id: string;
  wallet_address: string;
  display_name: string;
  email: string;
  avatar_url: string;
  credits: number;
  created_at: string;
  last_login: string;
}

class AccountManager {
  private currentAccount: Account | null = null;

  async getOrCreateAccount(walletAddress: string): Promise<Account | null> {
    if (!supabase) return null;

    const normalizedAddress = walletAddress.toLowerCase();

    try {
      const { data: existingAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (fetchError) {
        return null;
      }

      if (existingAccount) {
        await supabase
          .from('accounts')
          .update({ last_login: new Date().toISOString() })
          .eq('wallet_address', normalizedAddress);

        this.currentAccount = existingAccount as Account;
        return existingAccount as Account;
      }

      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          wallet_address: normalizedAddress,
          display_name: '',
          email: '',
          avatar_url: '',
        })
        .select()
        .single();

      if (createError) {
        return null;
      }

      this.currentAccount = newAccount as Account;
      return newAccount as Account;
    } catch (error) {
      return null;
    }
  }

  async updateAccount(updates: Partial<Pick<Account, 'display_name' | 'email' | 'avatar_url'>>): Promise<boolean> {
    if (!supabase || !this.currentAccount) return false;

    try {
      const { error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('wallet_address', this.currentAccount.wallet_address);

      if (error) {
        return false;
      }

      this.currentAccount = { ...this.currentAccount, ...updates };
      return true;
    } catch (error) {
      return false;
    }
  }

  getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  clearAccount(): void {
    this.currentAccount = null;
  }

  async getAccountByWallet(walletAddress: string): Promise<Account | null> {
    if (!supabase) return null;

    const normalizedAddress = walletAddress.toLowerCase();

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data as Account | null;
    } catch (error) {
      return null;
    }
  }
}

export const accountManager = new AccountManager();
