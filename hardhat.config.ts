import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  networks: {
    polygon: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY as string]
    },
    hardhat: {
      forking: {
        url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        blockNumber: 26486355
      }
    }
  }
};

export default config;
