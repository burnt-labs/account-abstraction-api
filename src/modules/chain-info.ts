export const defaultFee = {
  amount: [{ amount: "0", denom: "uxion" }],
  gas: "500000",
};

export const xionCoin = {
  coinDenom: "XION",
  coinMinimalDenom: "uxion",
  coinDecimals: 6,
};

export const testnetChainInfo = {
  rpc: process.env.XION_RPC_URL || "https://rpc.xion-testnet-1.burnt.com:443",
  rest: process.env.XION_REST_URL || "https://api.xion-testnet-1.burnt.com",
  chainId: "xion-testnet-1",
  stakeCurrency: xionCoin,
  chainName: "Xion Testnet",
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "xion",
    bech32PrefixValAddr: "xionvaloper",
    bech32PrefixValPub: "xionvaloperpub",
    bech32PrefixAccPub: "xionpub",
    bech32PrefixConsAddr: "xionvalcons",
    bech32PrefixConsPub: "xionvalconspub",
  },
  gas: { price: "0", denom: "uturnt" },
  currencies: [xionCoin],
  feeCurrencies: [xionCoin],
  features: ["cosmwasm"],
};

export const testChainInfo = {
  rpc: "http://localhost:26657",
  rest: "http://localhost:1317",
  chainId: "xion-local-testnet-1",
  stakeCurrency: xionCoin,
  chainName: "Xion Local Testnet",
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "xion",
    bech32PrefixValAddr: "xionvaloper",
    bech32PrefixValPub: "xionvaloperpub",
    bech32PrefixAccPub: "xionpub",
    bech32PrefixConsAddr: "xionvalcons",
    bech32PrefixConsPub: "xionvalconspub",
  },
  gas: { price: "0", denom: "uxion" },
  currencies: [xionCoin],
  feeCurrencies: [xionCoin],
  features: ["cosmwasm"],
};

export const burntChainInfo =
  process.env.NODE_ENV === "production" ? testnetChainInfo : testChainInfo;
