interface WalletDomainResponse {
  data: {
    names: {
      items: Array<{
        name: string;
      }>;
    };
  };
}

export interface WalletDomain {
  name: string;
  extension: string;
}

export async function fetchWalletDomains(walletAddress: string): Promise<WalletDomain[]> {
  // Format wallet address as CAIP-10 (eip155:chainId:address)
  // Using chain ID 97476 for the example
  const caip10Address = `eip155:97476:${walletAddress}`;
  const query = `
    query Items($ownedBy: [AddressCAIP10!]) {
      names(ownedBy: $ownedBy) {
        items {
          name
        }
      }
    }
  `;

  const apiKey = import.meta.env.VITE_DOMA_API_KEY;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Api-Key'] = apiKey;
  }

  const variables = {
    ownedBy: [caip10Address]
  };

  try {
    const response = await fetch('https://api-testnet.doma.xyz/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result: WalletDomainResponse = await response.json();

    if (!result.data?.names?.items) {
      return [];
    }

    // Parse domain names into name and extension
    return result.data.names.items.map(item => {
      const dotIndex = item.name.indexOf('.');
      if (dotIndex === -1) {
        return {
          name: item.name,
          extension: '.com'
        };
      }

      return {
        name: item.name.substring(0, dotIndex),
        extension: item.name.substring(dotIndex)
      };
    });
  } catch (error) {
    console.error('Error fetching wallet domains:', error);
    throw error;
  }
}
