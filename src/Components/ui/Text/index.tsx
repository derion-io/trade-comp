import React from 'react'
import './style.scss'

type TextType = React.HTMLAttributes<HTMLSpanElement> & { children: any }

export const Text = (props: TextType) => {
  return (
    <span {...props} className={'derivable-text ' + props.className}>
      {props.children}
    </span>
  )
}

export const TextBuy = (props: TextType) => {
  return (
    <Text {...props} className={'text-buy ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextSell = (props: TextType) => {
  return (
    <Text {...props} className={'text-sell ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextGrey = (props: TextType) => {
  return (
    <Text {...props} className={'text-grey ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextGreen = (props: TextType) => {
  return (
    <Text {...props} className={'text-green ' + props.className}>
      {props.children}
    </Text>
  )
}
