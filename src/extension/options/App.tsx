import { useEffect, useState } from 'preact/hooks'
import { getAllConfigs } from '@src/config'
import OptionsPage from '@src/components/OptionsPage'

function App() {
  const [config, setConfig] = useState(null as any)

  useEffect(() => {
    getAllConfigs().then((config) => setConfig(config))
  }, [])

  return <OptionsPage config={config} />
}

export default App
