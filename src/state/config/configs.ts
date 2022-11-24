export default {
  56: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    scanApi: 'https://api.bscscan.com/api',
    explorer: 'https://bscscan.com',
    scanName: 'BscScan',
    ddlGenesisBlock: 22683582,
    addresses: {
      multiCall: '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D',
      tokensInfo: '0x6B451b1bdaa7088467961FC0370d4049DF1C2E4d',
      pairsInfo: '0xf7Eb29dFfcDb11BC82D094e3bffA3E5764117A22',
      bnA: '0xA0c0Da3e41c401A601c7c93C4036773B5Ac47be2',
      wrapToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      tokenC: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      poolFactory: '0x693Fde587B7Bc021EEE2f589e9Cd51bA16e2571c',
      tokenFactory: '0xB5075BD30C1596eBA35347397F5747258770DdB4',
      logic: '0x555712f659587a47267028656DEa18D26aDf06b3',
      router: '0xa5C829195b3614185D9DC1001D6651E9a82c4aad',
      pool: '0x2449bc7351976601814cf95595F3C8046Bf41e25',

      // hardcode, this config will load by contract later
      dToken1: '0xcD70A9269907f69870264a94CDb834cF6dAfb8b8',
      dToken2: '0xfC4a7B7Bb09bD5C950E1d0D5c3266CA285b5ba7b',
      dToken3: '0xFFE34937F4486DdEa901e332f720523ddb307d37',
      dToken4: '0xbbDF7765d0Fe3DCe6CA07664505662e3D772Cd8B',
      baseToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      quoteToken: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    },
    powers: [-32, -4, 4, 32]
  },
  31337: {
    rpcUrl: 'http://localhost:8545/',
    explorer: 'https://bscscan.com',
    scanApi: 'https://api.bscscan.com/api',
    scanName: 'Localhost Scan',
    ddlGenesisBlock: 0,
    addresses: {
      multiCall: '0x3bc605DBD3f9d8e9B6FACdfc6548f8BD3b0f0Af5',
      tokensInfo: '0xD633ee476cfD10B300F20ae23ABAebf4B35BE18F',
      pairsInfo: '0x82fcaa6c2C9D103b916d4E3bfbDc8DCD8637875E',
      bnA: '0x66c409EB2937C9627Db0622D48DC8B4982fC58D6',
      wrapToken: '0xB29439A682eBa17df241944D5eFAE0f44fcf431B',
      nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      tokenC: '0x40f6d9AE858E7556De3524CbeeD443b0219d7eCC',
      poolFactory: '0x40f6d9AE858E7556De3524CbeeD443b0219d7eCC',
      tokenFactory: '0xfBD6F7Af174A316104Df529D1ca5D508Fb081b7F',
      logic: '0xdBa9451aC3f3a4a5171715EB5B776316aA474E62',
      router: '0x329AC0E65141453BB9735EDC9ee3A7515735f4F3',
      pool: '0xEB622c077C62aab627f852cb6B26D624560Cf8ca',

      // hardcode, this config will load by contract later
      baseToken: '0xB29439A682eBa17df241944D5eFAE0f44fcf431B',
      quoteToken: '0xe1D3EDf0d8c66B9b11ff111eEE25b56095C50903',
      dToken1: '0xb62667dDc055b11524D38D8738408C8DD77AE7e2',
      dToken2: '0x8f8Ee5279925110C96Ecabc00CC55B760a649961',
      dToken3: '0xAD92E903a9E25b6cED30Abca0B9B37e51816C5a8',
      dToken4: '0xd3f55A36c6C5292dBA2d2D006704a267d9Ea5499'
    },
    powers: [-32, -4, 4, 32]
  }
}
