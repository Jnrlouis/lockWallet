require("@nomiclabs/hardhat-waffle");
require("dotenv").config({ path: ".env" });

//const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;
const BINANCE_PRIVATE_KEY = process.env.BINANCE_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.4",
  networks: {
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [BINANCE_PRIVATE_KEY],
    },
  },
};
