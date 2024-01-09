import { InputProps } from 'antd'
import React, { ChangeEvent, KeyboardEvent, useCallback, useEffect } from 'react'
import { Input } from '../../ui/Input'
import { useAllLists } from '../../../state/lists/hooks'

export const SearchCurrencies = (
  props: {
    value: string,
    placeholder: string,
  }) => {
  const lists = useAllLists()
  useEffect(() => {
    console.log('#', lists)
  }, [lists])
  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {

  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {

      }
    },
    []
  )

  return (
    <Input placeholder={props.placeholder}/>
  )
}
