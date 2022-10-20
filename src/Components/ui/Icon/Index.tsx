import React from 'react'

type IconType = React.HTMLAttributes<HTMLOrSVGElement> & {
  fill?: string
}

export const IconArrowDown = (props: IconType) => {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M15.7348 14.0909C16.1094 14.4968 16.0841 15.1294 15.6783 15.504L12.1783 18.7348C11.7953 19.0884 11.2048 19.0884 10.8218 18.7348L7.32172 15.504C6.9159 15.1294 6.89059 14.4968 7.26519 14.091C7.63979 13.6851 8.27245 13.6598 8.67827 14.0344L10.5 15.716L10.5 6C10.5 5.44772 10.9477 5 11.5 5C12.0523 5 12.5 5.44771 12.5 6L12.5 15.716L14.3217 14.0344C14.7275 13.6598 15.3602 13.6851 15.7348 14.0909Z'
        fill={props.fill ? props.fill : '#808191'}
      />
    </svg>
  )
}

export const IconArrowLeft = (props: IconType) => {
  return (
    <svg
      width='25'
      height='24'
      viewBox='0 0 25 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M14.5909 7.26521C14.9968 6.8906 15.6294 6.9159 16.004 7.32172L19.2348 10.8217C19.5884 11.2047 19.5884 11.7952 19.2348 12.1782L16.004 15.6783C15.6294 16.0841 14.9968 16.1094 14.591 15.7348C14.1851 15.3602 14.1598 14.7276 14.5344 14.3217L16.216 12.5L6.5 12.5C5.94771 12.5 5.5 12.0523 5.5 11.5C5.5 10.9477 5.94771 10.5 6.5 10.5L16.216 10.5L14.5344 8.67829C14.1598 8.27247 14.1851 7.63981 14.5909 7.26521Z'
        fill={props.fill ? props.fill : '#ffffff'}
      />
    </svg>
  )
}
