import { CHAINS } from '../../utils/constant'

export default {
  [CHAINS.GANACHE]: {
    rpcUrl: 'http://localhost:8545/',
    rpcToGetLogs: 'http://localhost:8545/',
    explorer: 'https://bscscan.com',
    scanApi: '',
    scanName: 'Localhost Scan',
    ddlGenesisBlock: 0,
    timePerBlock: 3000,
    nativeToken: {
      name: 'ETH',
      symbol: 'ETH',
      decimal: 18,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    addresses: {
      reserveTokenPrice: '0x0000000000000000000000000000000000000001',
      uniswapFactory: '0x2B528278eEEf8d30838fCC6297e6f28D4F03b1BD',
      token: '0x2e10024346cDd08E1e9071B16a51d89d46de8003',
      multiCall: '0x7AF7e1669Af4c76B566BFeC7AB722ba6dE0719A3',
      pairsInfo: '0xa3030Cef13eFd3E625c576A622E6123Cf7B4006d',
      pairsV3Info: '0x72d6D4aB65491cbF6DAF5D38838fdEBb7603f4B0',
      bnA: '0x0748990Cd23F13545805295eD1aED30D9f335984',
      tokensInfo: '0x2bdcF38cd1cb4db04ac6604ECaa02C2fbf1e13e2',
      router: '0x4F1111145AB659CF9BBB45442F54A5D427783DaA',
      wrapToken: '0x56403E93d5D593E29d47eE5C743058A5993FD2B3',
      wrapUsdPair: '0x215bfCCF305135AbCAa18b9C0e9738924a53A0E6',
      poolFactory: '0x964fD9F84e0e543648Bd1835A6A3A33DEbC7E0f8',
      stateCalHelper: '0x270bf3040041160e309130d6AF61c1a7aBf2497D',
      logic: '0xE1550e06C6759b48cD0a6f5851029A30a6Fee735',
    },
    stableCoins: [
      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    ]
  },
  [CHAINS.ARBITRUM]: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcToGetLogs: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    scanApi: 'https://api.arbiscan.io/api',
    candleChartApi: 'https://api.derivable.org/56/chart/',
    theGraphExchange: 'https://api.thegraph.com/subgraphs/name/sushi-v2/sushiswap-arbitrum',
    theGraphArbitrum: 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum',
    scanName: 'Arbitrum Scan',
    ddlGenesisBlock: 70615018,
    timePerBlock: 1000,
    nativeToken: {
      name: 'ETH',
      symbol: 'ETH',
      decimal: 18,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    addresses: {
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      reserveTokenPrice: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474',
      uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      token: '0x1BA630bEd23129aed65BFF106cd15C4B457a26e8',
      stateCalHelper: '0x44C3f64d31404921dD82880fCC8393FD543975Df',
      multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
      pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
      pairsV3Info: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
      bnA: '0x357FF35761979254F93a21995b20d9071904603d',
      tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
      router: '0xbc9a257e43f7b3b1a03aEBE909f15e95A4928834',
      poolFactory: '0xF817EBA38BebD48a58AE38360306ea0E243077cd',
      wrapToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      wrapUsdPair: '0xCB0E5bFa72bBb4d16AB5aA0c60601c438F04b4ad'
    },
    stableCoins: [
      '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
    ]
  }
}
