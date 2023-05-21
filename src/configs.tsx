import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ReactComponent as Icon } from './icon.svg'

const svgText = ReactDOMServer.renderToString(<Icon />)

export default {
  // Any component should be ok as long as it's props respect className which is resizable by CSS
  icon: (props: any) => (
    <img src={`data:image/svg+xml;base64,${btoa(svgText)}`} {...props} />
  ),
  name: 'Dapp',
  path: '/swap',
  children: [
    {
      name: 'Trade',
      path: '/:tab(swap|exposure)/:pool?',
      menuLink: '/swap'
    },
    // {
    //   name: 'Liquidity',
    //   path: '/:tab(add-liquidity|remove-liquidity)',
    //   menuLink: '/add-liquidity'
    // },
    {
      name: 'Pools',
      path: '/pools'
    }
  ]
}
