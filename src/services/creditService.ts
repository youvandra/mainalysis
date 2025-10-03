import { supabase, getAccountId } from '../lib/supabase';

export interface CreditBalance {
  account_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  account_id: string;
  type: 'purchase' | 'usage';
  amount: number;
  balance_after: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  base_price: number;
  final_price: number;
  features: string[];
  is_popular: boolean;
  sort_order: number;
}

class CreditService {
  async getCreditBalance(): Promise<CreditBalance | null> {
    if (!supabase) return null;

    const accountId = await getAccountId();
    if (!accountId) return null;

    try {
      const { data, error } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async getTransactionHistory(limit = 50): Promise<CreditTransaction[]> {
    if (!supabase) return [];

    const accountId = await getAccountId();
    if (!accountId) return [];

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  async purchaseCredits(packageId: string): Promise<boolean> {
    if (!supabase) return false;

    const accountId = await getAccountId();
    if (!accountId) return false;

    try {
      const { data: pkg, error: pkgError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (pkgError || !pkg) {
        return false;
      }

      const { error } = await supabase.rpc('add_credits', {
        p_account_id: accountId,
        p_amount: pkg.credits,
        p_description: `Purchased ${pkg.name} package`,
        p_metadata: {
          package_id: packageId,
          package_name: pkg.name,
          price_paid: pkg.final_price,
        },
      });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async useCredit(domainName: string, amount: number = 1, source: string = 'domain analysis'): Promise<boolean> {
    if (!supabase) return false;

    const accountId = await getAccountId();
    if (!accountId) return false;

    try {
      const { data, error } = await supabase.rpc('use_credits', {
        p_account_id: accountId,
        p_amount: amount,
        p_description: `${source} - ${domainName}`,
        p_metadata: {
          domain_name: domainName,
          source: source,
          credits_used: amount,
        },
      });

      if (error) {
        console.error('Error using credit:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in useCredit:', error);
      return false;
    }
  }

  calculatePackagePrice(credits: number): { basePrice: number; finalPrice: number; discount: number } {
    const pricePerCredit = 0.2;
    const basePrice = credits * pricePerCredit;
    const bulkDiscountTiers = Math.floor(credits / 1000);
    const discount = bulkDiscountTiers * 10;
    const finalPrice = Math.max(0, basePrice - discount);

    return {
      basePrice,
      finalPrice,
      discount,
    };
  }
}

export const creditService = new CreditService();
