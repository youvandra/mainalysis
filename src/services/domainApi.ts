const GRAPHQL_ENDPOINT = 'https://api-testnet.doma.xyz/graphql';

export interface DomainListing {
  name: string;
  price: number;
  createdAt: string;
  registrar: {
    name: string;
  };
  chain: {
    name: string;
  };
}

export interface ListingsResponse {
  listings: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: DomainListing[];
    pageSize: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  take?: number;
  skip?: number;
  tlds?: string[];
  sld?: string;
}

async function fetchListingsPage(params: PaginationParams): Promise<ListingsResponse['listings']> {
  const query = `
    query Listings($take: Int, $skip: Int, $tlds: [String!], $sld: String) {
      listings(take: $take, skip: $skip, tlds: $tlds, sld: $sld) {
        currentPage
        hasNextPage
        hasPreviousPage
        items {
          name
          price
          createdAt
          registrar {
            name
          }
          chain {
            name
          }
        }
        pageSize
        totalPages
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

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: params,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL request failed');
  }

  return result.data.listings;
}

export async function fetchDomainListings(tlds?: string[]): Promise<DomainListing[]> {
  try {
    const data = await fetchListingsPage({ take: 20, skip: 0 });
    return data.items;
  } catch (error) {
    console.error('Failed to fetch domain listings:', error);
    throw error;
  }
}

export async function fetchDomainListingsPaginated(params: PaginationParams): Promise<ListingsResponse['listings']> {
  try {
    return await fetchListingsPage(params);
  } catch (error) {
    console.error('Failed to fetch domain listings:', error);
    throw error;
  }
}

export interface FractionalToken {
  address: string;
  boughtOutAt: string | null;
  boughtOutBy: string | null;
  boughtOutTxHash: string | null;
  buyoutPrice: string | null;
  chain: {
    name: string;
  };
  currentPrice: string;
  fractionalizedAt: string;
  fractionalizedBy: string;
  fractionalizedTxHash: string;
  graduatedAt: string | null;
  id: string;
  launchpadAddress: string;
  metadata: {
    description: string;
    title: string;
    image?: string;
    primaryWebsite?: string;
    xLink?: string;
    additionalWebsites?: {
      name: string;
      url: string;
    }[];
  } | null;
  metadataURI: string;
  name: string;
  params: {
    decimals: number;
    finalLaunchpadPrice: string;
    initialLaunchpadPrice: string;
    initialPoolPrice: string;
    initialValuation: string;
    launchEndDate: string;
    launchStartDate: string;
    launchpadData: string;
    launchpadFeeBps: number;
    launchpadSupply: string;
    launchpadType: string;
    metadataURI: string;
    name: string;
    poolFeeBps: number;
    poolSupply: string;
    symbol: string;
    totalSupply: string;
    vestingCliffSeconds: number;
    vestingDurationSeconds: number;
  };
  poolAddress: string;
  status: string;
  vestingWalletAddress: string;
}

export interface FractionalTokensResponse {
  fractionalTokens: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: FractionalToken[];
  };
}

export async function checkDomainListed(domainName: string, extension: string): Promise<boolean> {
  const query = `
    query Items($sld: String, $tlds: [String!]) {
      listings(sld: $sld, tlds: $tlds) {
        items {
          name
        }
      }
    }
  `;

  // Remove the dot from extension for the tlds parameter
  const tld = extension.startsWith('.') ? extension.substring(1) : extension;

  const variables = {
    sld: domainName,
    tlds: [tld]
  };

  const apiKey = import.meta.env.VITE_DOMA_API_KEY;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Api-Key'] = apiKey;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();

    if (result.errors) {
      return false;
    }

    const items = result.data?.listings?.items;
    return items && items.length > 0;
  } catch (error) {
    console.error('Error checking domain listing:', error);
    return false;
  }
}

export async function fetchFractionalTokens(take: number = 20): Promise<FractionalToken[]> {
  const query = `
    query NameStatistics($take: Int) {
      fractionalTokens(take: $take) {
        currentPage
        hasNextPage
        hasPreviousPage
        items {
          address
          boughtOutAt
          boughtOutBy
          boughtOutTxHash
          buyoutPrice
          chain {
            name
          }
          currentPrice
          fractionalizedAt
          fractionalizedBy
          fractionalizedTxHash
          graduatedAt
          id
          launchpadAddress
          metadata {
            description
            title
            image
            primaryWebsite
            xLink
            additionalWebsites {
              name
              url
            }
          }
          metadataURI
          name
          params {
            decimals
            finalLaunchpadPrice
            initialLaunchpadPrice
            initialPoolPrice
            initialValuation
            launchEndDate
            launchStartDate
            launchpadData
            launchpadFeeBps
            launchpadSupply
            launchpadType
            metadataURI
            name
            poolFeeBps
            poolSupply
            symbol
            totalSupply
            vestingCliffSeconds
            vestingDurationSeconds
          }
          poolAddress
          status
          vestingWalletAddress
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

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: { take },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL request failed');
  }

  return result.data.fractionalTokens.items;
}
