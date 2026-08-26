export const TOKENS = [
  { symbol: "ETH", name: "Ethereum", price: 3450.2, address: "ETH", decimals: 18, icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029" },
  { symbol: "USDT", name: "Tether", price: 1.0, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=029" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029" },
  { symbol: "PEPE", name: "Pepe", price: 0.000012, address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18, icon: "https://cryptologos.cc/logos/pepe-pepe-logo.svg?v=029" },
  { symbol: "LINK", name: "Chainlink", price: 14.2, address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, icon: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=029" },
];

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
] as const;
