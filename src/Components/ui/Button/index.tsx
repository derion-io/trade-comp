import React from 'react'
import './style.scss'

type ButtonType = React.HTMLAttributes<HTMLButtonElement> & {
  children: any
  background?: string
  disabled?: boolean
  size?: 'normal' | 'large' | 'small'
}

export const Button = (props: ButtonType) => {
  return (
    <button
      {...props}
      className={`derivable-button ${
        props.size ? 'size-' + props.size : 'size-large'
      } ${props.className}`}
    >
      {props.children}
    </button>
  )
}

export const ButtonBuy = (props: ButtonType) => {
  return (
    <Button {...props} className={'buy ' + props.className}>
      {props.children}
    </Button>
  )
}

export const ButtonBorder = (props: ButtonType & { fill?: string }) => {
  return (
    <Button
      {...props}
      style={{
        borderColor: props.fill ? props.fill : '#01A7FA',
        color: props.fill ? props.fill : '#01A7FA',
        ...props.style
      }}
      className={'border ' + props.className}
    >
      {props.children}
    </Button>
  )
}

export const ButtonSell = (props: ButtonType) => {
  return (
    <Button {...props} className={'sell ' + props.className}>
      {props.children}
    </Button>
  )
}

export const ButtonGrey = (props: ButtonType) => {
  return (
    <Button {...props} className={'grey ' + props.className}>
      {props.children}
    </Button>
  )
}

export const ButtonExecute = (props: ButtonType) => {
  return (
    <Button {...props} className={'execute ' + props.className}>
      {props.children}
    </Button>
  )
}

export const ButtonReset = (props: ButtonType) => {
  return (
    <Button {...props} className={'reset ' + props.className}>
      {props.children}
    </Button>
  )
}
