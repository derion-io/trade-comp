export default {
  56: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    rpcToGetLogs: 'https://bscrpc.com',
    scanApi: 'https://api.bscscan.com/api',
    explorer: 'https://bscscan.com',
    scanName: 'BscScan',
    ddlGenesisBlock: 23917200,
    timePerBlock: 3000,
    // theGraphExchange: 'https://thegraph.com/hosted-service/subgraph/olastenberg/sushiswap-arbitrum-fix',
    // theGraphExchange: 'https://thegraph.com/hosted-service/subgraph/developerfred/pancake-exchange',
    theGraphExchange: 'https://data-platform.nodereal.io/graph/v1/95e657b8187749b5b5645487c7dd8bc5/projects/pancakeswap',
    candleChartApi: 'https://api.lz.finance/56/chart/',
    nativeToken: {
      name: 'BNB',
      symbol: 'BNB',
      decimal: 18,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    addresses: {
      multiCall: '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D',
      tokensInfo: '0x6B451b1bdaa7088467961FC0370d4049DF1C2E4d',
      pairsInfo: '0xf7Eb29dFfcDb11BC82D094e3bffA3E5764117A22',
      bnA: '0xA0c0Da3e41c401A601c7c93C4036773B5Ac47be2',
      wrapToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      wrapUsdPair: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      poolFactory: '0xfead51eBe15ba6E16586d59fEFa7249E5E1B6355',
      router: '0x2B1a5571C00B032d3bF0ca3271CdAa73b1cc6e5c'
    }
  },
  1337: {
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
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      multiCall: '0x025ff8c5CB97f5f79dc396DCD501Db775B00F433',
      pairsInfo: '0xc28A7e46bE1BB74a63aD32784D785A941D1954ab',
      bnA: '0x95a7d5edfD4701478D3ACA5DCb69D549D83E3c52',
      tokensInfo: '0xe2b8a85De2ad4076593B81F2435C77a2cb84caAf',
      router: '0xb60F861100aC9F8BE31D0e74DCae35D14cbcA2E2',
      wrapToken: '0x8F98902cf8255ab9D403Dfa68875b1024cd6C3d4',
      wrapUsdPair: '0x2B89B4931122EE4Fa474446Fa9B118F2852a8223'
    }
  },
  97: {
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    rpcToGetLogs: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorer: 'https://testnet.bscscan.com',
    scanApi: 'https://api-testnet.bscscan.com/api',
    scanName: 'BSC test Scan',
    ddlGenesisBlock: 0,
    timePerBlock: 3000,
    nativeToken: {
      name: 'BNB',
      symbol: 'BNB',
      decimal: 18,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    addresses: {
      multiCall: '0x73CCde5acdb9980f54BcCc0483B28B8b4a537b4A',
      tokensInfo: '0xE48cD6883C0B17aD3C9C321F6afB4d7f4708D647',
      pairsInfo: '0x010AfBf77C86d39949710789d1e4bcC5AB141DBb',
      bnA: '0x6A1a4e301E7634F2D14aEbDD6b38ec2fC6cec731',
      wrapToken: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      poolFactory: '0xd9Ba0343BED07AE5764c77d7e54d7C3EBaBcC8bC',
      router: '0xace397FBf3fA9f672b014C995Eb579317D55592d'
    }
  },
  42161: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcToGetLogs: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    scanApi: 'https://api.arbiscan.io/api',
    candleChartApi: 'https://api.lz.finance/56/chart/',
    // theGraphExchange: 'https://api.thegraph.com/subgraphs/name/sushi-v2/sushiswap-arbitrum',
    theGraphExchange: 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange',
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
      multiCall: '0x07BBBb79619a45D041549Baf8Ee7A60376d649cf',
      tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
      pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
      bnA: '0x357FF35761979254F93a21995b20d9071904603d',
      wrapToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      poolFactory: '0x848389D3c869dEF538b148cE5864eFee71C868e1',
      router: '0x0772BD1981f6092329F12FC041B83b2faBBB1A25'
    }
  }
}
