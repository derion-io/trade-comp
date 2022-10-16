import React from 'react'
import ReactDOM from 'react-dom'
import { Web3ReactProvider } from '@web3-react/core'
import configs from 'dapp-comp/dist/configs'
import { ethers } from 'ethers'
import { AppLayout } from "./components/AppLayout";
import { BrowserRouter as Router} from 'react-router-dom';
import './styles/main.scss'
import './index.css'

function getLibrary(provider: any) {
  const library = new ethers.providers.Web3Provider(provider)
  return library
}

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Router>
        <AppLayout
          configs={configs}
          Component={React.lazy(() => {
            // @ts-ignore
            import('dapp-comp/dist/component.css')
            return import('dapp-comp/dist/component')
          })}
        />
      </Router>
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
