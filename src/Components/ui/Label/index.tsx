import React from 'react'
import './style.scss'

type LabelType =React.HTMLAttributes<HTMLSpanElement> & {
  children: any
  background?: string
}

export const Label = (
  props: LabelType
) => {
  return (
    <div
      {...props}
      className={'derivable-label ' + props.className}
      style={{ ...props.style, background: props.background }}
    >
      {props.children}
    </div>
  )
}

export const LabelBuy = (props: LabelType) => {
  return (
    <Label {...props} className={'label-buy ' + props.className}>
      {props.children}
    </Label>
  )
}

export const LabelSell = (props: LabelType) => {
  return (
    <Label {...props} className={'label-sell ' + props.className}>
      {props.children}
    </Label>
  )
}

export const LabelGrey = (props: LabelType) => {
  return (
    <Label {...props} className={'label-grey ' + props.className}>
      {props.children}
    </Label>
  )
}

export const LabelGreen = (props: LabelType) => {
  return (
    <Label {...props} className={'label-green ' + props.className}>
      {props.children}
    </Label>
  )
}
