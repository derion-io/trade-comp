import React from 'react'
import './style.scss'
import {Button} from "../Button";


export const UserWalletModal = ({
    setVisible,
    visible,
    account,
    balance,
    deactivate
}: {
    setVisible: any
    visible: any
    account: string
    balance: string
    deactivate: any
}) => {
    return (
        <div className={`user-wallet-modal  ${visible ? '' : 'hidden'}`}>
            <div className='overlay' onClick={() => setVisible(false)}/>
            <div className='modal'>
                <div className='info-row'>
                    <span>Address</span>
                    <span className='w-25'>{account}</span>
                </div>
                <div className='info-row'>
                    <span>Balance:</span>
                    <span>{balance}</span>
                </div>
                <div className="text-center">
                    <Button onClick={() => {
                        deactivate()
                        setVisible(false)
                    }}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}
