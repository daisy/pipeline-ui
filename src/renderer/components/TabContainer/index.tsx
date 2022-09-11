import { useState } from 'react'
import { TabList } from '../TabList'
import { TabPanels } from '../TabPanels'

export function TabContainer() {
  const [selection, setSelection] = useState('')
  return (
    <>
      <TabList selection={selection} setSelection={setSelection} />
      <TabPanels selection={selection} />
    </>
  )
}
