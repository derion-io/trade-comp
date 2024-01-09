import 'rc-slider/assets/index.css'
import React, { Fragment } from 'react'
import isEqual from 'react-fast-compare'
import { Modal } from '../ui/Modal'
import './style.scss'
import { SearchCurrencies } from './components/searchCurrencies'
import { CommonCurrencies } from './components/commonCurrencies'
import { ListCurrencies } from './components/listCurrencies'

const Component = ({
  visible,
  setVisible
}: {
  visible: boolean
  setVisible: any
}) => {
  if (!visible) return <Fragment/>
  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title='Select a token'
    >
      <SearchCurrencies
        value='123'
        placeholder='Search name or paste address'
      />
      <CommonCurrencies/>
      <ListCurrencies/>
    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
