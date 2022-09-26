
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { Status, TabView } from 'renderer/components'
const queryClient = new QueryClient()



export function MainScreen() {


  return (
    <QueryClientProvider client={queryClient}>
        <header>
          <h1>DAISY Pipeline</h1>
          <Status />
        </header>
        <main>
          <TabView />
        </main>
    </QueryClientProvider>
  )
}
