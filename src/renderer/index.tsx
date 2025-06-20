import ReactDom from 'react-dom/client'
import React from 'react'

import { WindowStoreProvider } from './store'
import { AppRoutes } from './routes'

import './style2/global.css'

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
    <React.StrictMode>
        <WindowStoreProvider>
            <AppRoutes />
        </WindowStoreProvider>
    </React.StrictMode>
)
