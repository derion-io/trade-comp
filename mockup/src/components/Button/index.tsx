import React from 'react'
import './style.scss'


export const Button = (props: any) => {
    return (
        <button
            {...props}
            className={`btn ${props.className}`}
        >
            {props.children}
        </button>
    )
}
