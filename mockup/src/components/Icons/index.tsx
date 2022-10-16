import React from 'react';

const BaseIcon = (props: any) => {
    return <span
        role="img"
        className="lz-icon icon"
        {...props}
    >
        {props.children}
    </span>
}

export const HomeIcon = (props: any) => (
    <BaseIcon
        {...props}
    >
        <img src="/icons/home.svg" alt=""/>
    </BaseIcon>
)

export const SfarmIcon = (props: any) => (
    <BaseIcon
        {...props}
    >
        <img src="/icons/sfarm.svg" alt=""/>
    </BaseIcon>
)

export const WalletLogoIcon = (props: any) => (
    <BaseIcon
        {...props}
    >
        <img src="/icons/wallet-logo.svg" alt=""/>
    </BaseIcon>
)
