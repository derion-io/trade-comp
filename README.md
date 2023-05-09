# swap-interface

## Installation and usage

1. install package

```
  yarn
```

2. install mockup package

```
  cd mockup
  yarn
```

3. Open 2 terminal and run 2 parallel command

```
  yarn start
```

and

```
  yarn mockup:watch
```

# Setup environment for build UI

## Setup ganache and deploy contract

### install ganache

https://github.com/trufflesuite/ganache-ui/releases/tag/v2.7.0-beta

### Clone contract repo

https://github.com/derivable-labs/derivable-core
and then please checkout brach `v3-ganache`

### Deploy contract to ganache network

- Setup ganache with this config: + mnemonic: `kick balcony people guess oppose verb faint explain spoil learn that pool` + Balance : `10000000000` ETH + Gas Limit: `30000000` + chainId: `1337` + port: `8545`
- run deploy scrip: + go to derivable-core, with branch v3-ganache + run: `yarn deploy:ganache`

## Setup Front - End

### Clone frontend repo

https://github.com/derivable-labs/exposure-comp
and then please checkout branch ` v3`

### Installation and usage

1. install package

```
  yarn
```

2. install mockup package

```
  cd mockup
  yarn
```

3. Open 2 terminal and run 2 parallel command

```
  yarn start
```

and

```
  yarn mockup:watch
```
