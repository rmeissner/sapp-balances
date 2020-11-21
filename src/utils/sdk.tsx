import React from 'react'
import SDK from '@gnosis.pm/safe-apps-sdk'

const SDKContext = React.createContext<SDK>(new SDK())
export const useSdk = () => React.useContext(SDKContext)