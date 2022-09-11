import { WindowRouter, Route } from './modules'

import { MainScreen, AboutScreen } from 'renderer/screens'

export function AppRoutes() {
  return (
    <WindowRouter
      routes={{
        main: () => (
          <>
            <Route path="/" element={<MainScreen />} />
          </>
        ),
        about: () => <Route path="/" element={<AboutScreen />} />,
      }}
    />
  )
}
