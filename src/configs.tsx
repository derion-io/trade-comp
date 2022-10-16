import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ReactComponent as Icon } from './icon.svg'

const svgText = ReactDOMServer.renderToString(<Icon />)
console.log(svgText)

export default {
  // Any component should be ok as long as it's props respect className which is resizable by CSS
  icon: (props: any) => (
    <img src={`data:image/svg+xml;base64,${btoa(svgText)}`} {...props} />
  ),
  name: 'Dapp',
  path: '/dapp',
  children: [
    {
      name: 'Sub Menu 1',
      path: '/dapp/sub1'
    },
    {
      name: 'Sub Menu 2',
      path: '/dapp/sub2'
    }
  ]
}
