import { BrowserProvider } from 'ethers';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
}

class WalletManager {
  private listeners: ((state: WalletState) => void)[] = [];
  private currentAddress: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        this.handleAccountsChanged(accounts);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      this.checkConnection();
    }
  }

  private async handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.currentAddress = null;
      this.notifyListeners();

      try {
        const { accountManager } = await import('./account');
        accountManager.clearAccount();
      } catch (error) {
      }
    } else {
      const normalizedAddress = accounts[0].toLowerCase();
      if (normalizedAddress !== this.currentAddress) {
        this.currentAddress = normalizedAddress;
        this.notifyListeners();

        try {
          const { accountManager } = await import('./account');
          await accountManager.getOrCreateAccount(this.currentAddress);
        } catch (error) {
        }
      }
    }
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async checkConnection(): Promise<void> {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        this.currentAddress = accounts[0].address.toLowerCase();
        this.notifyListeners();

        const { accountManager } = await import('./account');
        await accountManager.getOrCreateAccount(this.currentAddress);
      }
    } catch (error) {
    }
  }

  async connect(): Promise<string | null> {
    if (!window.ethereum) {
      const userChoice = confirm(
        'MetaMask is not installed.\n\n' +
        'To use this application, you need to install MetaMask wallet extension.\n\n' +
        'Click OK to visit MetaMask website, or Cancel to stay on this page.'
      );

      if (userChoice) {
        window.open('https://metamask.io/download/', '_blank');
      }
      return null;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);

      // Request account access first
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length > 0) {
        this.currentAddress = accounts[0].toLowerCase();
        this.notifyListeners();

        // Try to create/get account (non-blocking)
        try {
          const { accountManager } = await import('./account');
          await accountManager.getOrCreateAccount(this.currentAddress);
        } catch (accountError) {
          // Continue even if account creation fails
        }

        // Optional: Try to switch to chain ID 97476 (non-blocking)
        const targetChainId = '0x17ce4'; // 97476 in hex
        try {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: targetChainId }
          ]);
        } catch (switchError: any) {
          // If chain doesn't exist, try to add it
          if (switchError.code === 4902) {
            try {
              await provider.send('wallet_addEthereumChain', [
                {
                  chainId: targetChainId,
                  chainName: 'Intersteller Testnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc-testnet.intersteller.io'],
                  blockExplorerUrls: ['https://explorer-testnet.intersteller.io']
                }
              ]);
            } catch (addError) {
            }
          } else if (switchError.code === 4001) {
          } else {
          }
        }

        return this.currentAddress;
      }

      return null;
    } catch (error: any) {
      if (error.code === 4001) {
      } else {
      }
      return null;
    }
  }

  async disconnect(): Promise<void> {
    this.currentAddress = null;
    this.notifyListeners();

    const { accountManager } = await import('./account');
    accountManager.clearAccount();
  }

  getAddress(): string | null {
    return this.currentAddress;
  }

  getState(): WalletState {
    return {
      address: this.currentAddress,
      isConnected: this.currentAddress !== null,
    };
  }

  isConnected(): boolean {
    return this.currentAddress !== null;
  }
}

export const walletManager = new WalletManager();

declare global {
  interface Window {
    ethereum?: any;
  }
}
