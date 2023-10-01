import React from 'react'
import ReactDOM from 'react-dom'
import { Web3ReactProvider } from '@web3-react/core'
import configs from 'dapp-comp/dist/configs'
import { AppLayout } from "./components/AppLayout";
import { HashRouter as Router} from 'react-router-dom';
import './styles/main.scss'
import './index.css'
import { connectors } from './utils/connectors'

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider connectors={connectors}>
      {/*@ts-ignore*/}
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
