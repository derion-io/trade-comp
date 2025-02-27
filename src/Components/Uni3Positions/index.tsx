import {BigNumber} from 'ethers'
import React,{useState} from 'react'
import {useWindowSize} from '../../hooks/useWindowSize'
import {useFetchUni3Position, useUni3Position} from '../../state/uni3Positions/hooks/useUni3Positions'
import {bn,zerofy} from '../../utils/helpers'
import {PositionLoadingComponent} from '../BuyPositionBox/components/PositionLoading'
import {ButtonSell} from '../ui/Button'
import {InfoRow} from '../ui/InfoRow'
import {Text,TextGrey} from '../ui/Text'
import {TokenIcon} from '../ui/TokenIcon'
import './style.scss'

const mdp = require('move-decimal-point')

export enum VALUE_IN_USD_STATUS {
  AUTO,
  USD,
  TOKEN_R
}

export const Uni3Positions = ({
  setOutputTokenAddressToBuy,
  tokenOutMaturity,
  isLoadingIndex
}: {
  setOutputTokenAddressToBuy: any
  tokenOutMaturity: BigNumber
  isLoadingIndex: boolean
}) => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  const [now, setNow] = React.useState(Math.floor(new Date().getTime() / 1000))

  // TODO: put this to App, and pass down to each comp
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(new Date().getTime() / 1000))
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const { displayUni3Positions, setCurrentUni3Position } = useUni3Position()
  // const {poolGroups} = useResource()
  const [revertRange, setRevertRange] = useState<boolean>(false)
  const {uni3Loading} = useFetchUni3Position()
  return (
    <div className='positions-box'>
      {isPhone ? (
        uni3Loading ? (
          <PositionLoadingComponent />
        ) : (
          <div className='positions-list'>
            {Object.keys(displayUni3Positions).map((posKey, key: number) => {
              const position = displayUni3Positions[posKey]
              return (
                <div className='positions-list__item' key={key}>
                  <InfoRow>
                    <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token0Data.symbol}/{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token1Data.symbol}
                    </TextGrey>
                  </InfoRow>
                  <InfoRow>
                    <TextGrey>Reserves</TextGrey>
                    <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken0)} +{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken1)}
                    </TextGrey>
                  </InfoRow>
                  <InfoRow>
                    <TextGrey>Size</TextGrey>
                    <div>
                      {/* <Text className='d-flex align-item-center'>
                        {zerofy(position.posLiquidityByBaseToken ?? bn(0))}{' '}
                        <TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />
                      </Text> */}

                      <Text className='d-flex align-item-center'>
                        ${zerofy(position.totalPositionByUSD ?? bn(0))}{' '}
                      </Text>
                    </div>
                  </InfoRow>

                  <InfoRow>
                    <TextGrey>
                      Price Range{' '}
                      <Text
                        className='text-link'
                        onClick={() => {
                          setRevertRange(!revertRange)
                        }}
                      >
                        ⇄
                      </Text>
                    </TextGrey>
                    <React.Fragment>
                      {revertRange ? (
                        <TextGrey className='d-flex align-item-center'>
                          {zerofy(1 / position.pxUpper)}
                          {'<-->'}
                          {zerofy(1 / position.pxLower)} (
                          <TokenIcon
                            tokenAddress={position?.token0}
                            size={16}
                            iconSize='1.4ex'
                          />{' '}
                          /{' '}
                          <TokenIcon
                            tokenAddress={position?.token1}
                            size={16}
                            iconSize='1.4ex'
                          />
                          )
                        </TextGrey>
                      ) : (
                        <TextGrey className='d-flex align-item-center'>
                          {zerofy(position.pxUpper)}
                          {'<-->'}
                          {zerofy(position.pxLower)} (
                          <TokenIcon
                            tokenAddress={position?.token1}
                            size={16}
                            iconSize='1.4ex'
                          />{' '}
                          /{' '}
                          <TokenIcon
                            tokenAddress={position?.token0}
                            size={16}
                            iconSize='1.4ex'
                          />
                          )
                        </TextGrey>
                      )}
                    </React.Fragment>
                  </InfoRow>

                  {position.fee ? (
                    <InfoRow>
                      <TextGrey>Fee</TextGrey>
                      <Text>{Number(position.fee) / 1e4}%</Text>
                    </InfoRow>
                  ) : (
                    ''
                  )}

                  <InfoRow>
                    <React.Fragment></React.Fragment>
                    <ButtonSell
                      size='small'
                      onClick={(e) => {
                        window.open(
                          `https://app.uniswap.org/pool/${
                            posKey.split('-')[1]
                          }`,
                          '_blank'
                        )
                      }}
                    >
                      Explore
                    </ButtonSell>
                  </InfoRow>
                </div>
              )
            })}
          </div>
        )
      ) : uni3Loading ? (
        <PositionLoadingComponent />
      ) : (
        <table className='positions-table'>
          <thead>
            <tr>
              <th>Pool</th>
              <th>Reserves</th>
              <th>Size</th>
              <th className='no-wrap'>
                Price Range{' '}
                <Text
                  className='text-link'
                  onClick={() => {
                    setRevertRange(!revertRange)
                  }}
                >
                  ⇄
                </Text>
              </th>
              <th>Fee</th>

              <th />
            </tr>
          </thead>
          <tbody>
            {Object.keys(displayUni3Positions).map((posKey, key: number) => {
              const position = displayUni3Positions[posKey]
              return (
                <tr
                  className='position-row'
                  onClick={() => {
                    setCurrentUni3Position(posKey)
                  }}
                  key={key}
                >
                  <td>
                    <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token0Data.symbol}/{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token1Data.symbol}
                    </TextGrey>
                  </td>
                  <td>
                    <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken0)} +{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken1)}
                    </TextGrey>
                  </td>
                  <td>
                    <Text className='d-flex align-item-center'>
                      ${zerofy(position.totalPositionByUSD ?? 0)}{' '}
                    </Text>
                  </td>
                  <td>
                    <div className='net-value-and-pnl'>
                      <React.Fragment>
                        {revertRange ? (
                          <TextGrey className='d-flex align-item-center'>
                            {zerofy(1 / position.pxUpper)}
                            {'<-->'}
                            {zerofy(1 / position.pxLower)} (
                            <TokenIcon
                              tokenAddress={position?.token1}
                              size={16}
                              iconSize='1.4ex'
                            />{' '}
                            /{' '}
                            <TokenIcon
                              tokenAddress={position?.token0}
                              size={16}
                              iconSize='1.4ex'
                            />
                            )
                          </TextGrey>
                        ) : (
                          <TextGrey className='d-flex align-item-center'>
                            {zerofy(position.pxLower)}
                            {'<-->'}
                            {zerofy(position.pxUpper)} (
                            <TokenIcon
                              tokenAddress={position?.token0}
                              size={16}
                              iconSize='1.4ex'
                            />{' '}
                            /{' '}
                            <TokenIcon
                              tokenAddress={position?.token1}
                              size={16}
                              iconSize='1.4ex'
                            />
                            )
                          </TextGrey>
                        )}
                      </React.Fragment>
                    </div>
                  </td>
                  <td>
                    <Text>{Number(position.fee) / 1e4}%</Text>
                  </td>

                  <td className='text-right'>
                    <ButtonSell
                      size='small'
                      onClick={(e) => {
                        window.open(
                          `https://app.uniswap.org/pool/${
                            posKey.split('-')[1]
                          }`,
                          '_blank'
                        )
                      }}
                    >
                      Explore
                    </ButtonSell>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
