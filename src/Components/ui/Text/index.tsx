import React from 'react'
import './style.scss'

type TextType = React.HTMLAttributes<HTMLSpanElement> & {
  children: any
  fontSize?: number
  fontWeight?: number
  whiteSpace?: 'nowrap'
}

export const Text = (props: TextType) => {
  return (
    <span
      {...props}
      className={'derivable-text ' + props.className}
      style={{
        whiteSpace: props.whiteSpace ? props.whiteSpace : 'inherit',
        fontSize: props.fontSize,
        fontWeight: props.fontWeight
      }}
    >
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

export const TextWarning = (props: TextType) => {
  return (
    <Text {...props} className={'text-warning ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextError = (props: TextType) => {
  return (
    <Text {...props} className={'text-error ' + props.className}>
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

export const TextPink = (props: TextType) => {
  return (
    <Text {...props} className={'text-pink ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextBlue = (props: TextType) => {
  return (
    <Text {...props} className={'text-blue ' + props.className}>
      {props.children}
    </Text>
  )
}

export const TextLink = (props: TextType & { href?: string }) => {
  return (
    <Text
      {...props}
      className={'text-link ' + props.className}
      onClick={(e) => {
        if (props.href) {
          window.open(props.href)
        }
        if (props.onClick) {
          props.onClick(e)
        }
      }}
    >
      {props.children}
    </Text>
  )
}
