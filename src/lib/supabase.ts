import { createClient } from '@supabase/supabase-js';
import { walletManager } from './wallet';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getWalletAddress = (): string | null => {
  return walletManager.getAddress();
};

export const getAccountId = async (): Promise<string | null> => {
  const { accountManager } = await import('./account');
  const account = accountManager.getCurrentAccount();
  return account?.id || null;
};
