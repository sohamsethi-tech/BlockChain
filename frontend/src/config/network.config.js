export const NETWORK = {
  chainId: "0xaa36a7",
  chainName: "Sepolia Test Network",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [import.meta.env.VITE_ALCHEMY_RPC || "https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};