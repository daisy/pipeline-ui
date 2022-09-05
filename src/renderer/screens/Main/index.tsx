import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import { Container, Heading, JobsList } from 'renderer/components'
import { useWindowStore } from 'renderer/store'

export function MainScreen() {
  const { App } = window // The "App" comes from the bridge

  const navigate = useNavigate()
  const store = useWindowStore().about

  useEffect(() => {
    App.sayHelloFromBridge()

    App.whenAboutWindowClose(({ message }) => {
      console.log(message)

      store.setAboutWindowState(false)
    })
  }, [])

  function openAboutWindow() {
    App.createAboutWindow()
    store.setAboutWindowState(true)
  }

  return (
    <Container>
      <Heading>Hi, {App.username || 'there'}! 👋</Heading>

      <h2>Jobs ✨</h2>

      <JobsList />
    </Container>
  )
}
