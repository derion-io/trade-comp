import React, { useState } from 'react'
import { TextBuy } from '../ui/Text'
import './style.scss'
import { ButtonBorder } from '../ui/Button'
import { Collapse } from 'react-collapse'
import { ExpandPool } from './ExpandPool'

export const PoolTable = () => {
  return (
    <div className='pool-table-wrap'>
      {/* <Box> */}
      {/*  <Input */}
      {/*    placeholder='Search token or address' */}
      {/*    inputWrapProps={{ */}
      {/*      style: { */}
      {/*        background: 'transparent', */}
      {/*        borderColor: '#6c6c6c' */}
      {/*      } */}
      {/*    }} */}
      {/*  /> */}
      {/* </Box> */}
      <table className='pool-table'>
        <thead>
          <tr>
            <th className='text-left'>Pool</th>
            <th className='text-left'>Asset</th>
            <th className='text-left'>Size</th>
            <th className='text-left'>Net val</th>
            <th className='text-left'>Average</th>
            <th className='text-left'>Leverage</th>
            <th className='text-right'>
              <ButtonBorder className='pt-05 pb-05'>Add</ButtonBorder>
            </th>
          </tr>
        </thead>
        <tbody>
          <PoolRow />
        </tbody>
      </table>
    </div>
  )
}

export const PoolRow = () => {
  const [isExpand, setIsExpand] = useState<boolean>(false)

  return <React.Fragment>
    <tr className='is-long-pool pool-tr' onClick={() => setIsExpand(!isExpand)}>
      <td className='text-left'>
        <TextBuy>0x8233...234</TextBuy>
      </td>
      <td className='text-left'>
        <TextBuy>ETH (Long)</TextBuy>
      </td>
      <td className='text-left'>
        <TextBuy>ETH (Long)</TextBuy>
      </td>
      <td className='text-left'>
        <TextBuy>100$</TextBuy>
      </td>
      <td className='text-left'>
        <TextBuy>100$</TextBuy>
      </td>
      <td className='text-left'>
        <TextBuy>x5</TextBuy>
      </td>
      <td className='text-right'>
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M7.99992 14.6666C11.6818 14.6666 14.6666 11.6818 14.6666 7.99992C14.6666 4.31802 11.6818 1.33325 7.99992 1.33325C4.31802 1.33325 1.33325 4.31802 1.33325 7.99992C1.33325 11.6818 4.31802 14.6666 7.99992 14.6666ZM6.47132 5.52851C6.21097 5.26816 5.78886 5.26816 5.52851 5.52851C5.26816 5.78886 5.26816 6.21097 5.52851 6.47132L7.05711 7.99992L5.52851 9.52851C5.26816 9.78886 5.26816 10.211 5.52851 10.4713C5.78886 10.7317 6.21097 10.7317 6.47132 10.4713L7.99992 8.94273L9.52851 10.4713C9.78886 10.7317 10.211 10.7317 10.4713 10.4713C10.7317 10.211 10.7317 9.78886 10.4713 9.52851L8.94273 7.99992L10.4713 6.47132C10.7317 6.21097 10.7317 5.78886 10.4713 5.52851C10.211 5.26816 9.78886 5.26816 9.52851 5.52851L7.99992 7.05711L6.47132 5.52851Z'
            fill='#FF7A68'
          />
        </svg>
      </td>
    </tr>
    <td colSpan={7} className='p-0'>
      <Collapse isOpened={isExpand} initialStyle={{ height: 0, overflow: 'hidden' }}>
        <ExpandPool visible={isExpand} />
      </Collapse>
    </td>
  </React.Fragment>
}
