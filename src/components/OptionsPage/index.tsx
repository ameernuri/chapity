import { Button, Input, Tabs, useInput, useToasts } from '@geist-ui/core'
import { getConfig, saveConfig } from '@src/config'
import { getExtensionVersion } from '@src/lib/utils'
import { useCallback, useEffect, useState } from 'preact/hooks'
import logo from '@src/assets/img/logo.png'

interface Props {
  config: any
}

const OptionsPage = ({ config }: Props) => {
  const [savedConfigs, setSavedConfigs] = useState()

  const { bindings: apiKeyBindings } = useInput(
    savedConfigs?.[config.optionsKeys.apiKeys.openai] ?? '',
  )

  const { bindings: nameKeyBindings } = useInput(
    savedConfigs?.[config.optionsKeys.profile.name] ?? '',
  )

  useEffect(() => {
    getConfig(config.optionsKeys.apiKeys.openai).then((config) => {
      setSavedConfigs(config)
    })
  }, [apiKeyBindings.value, config.optionsKeys.apiKeys.openai])

  const onSave = useCallback(async () => {
    saveConfig(config.optionsKeys.apiKeys.openai, apiKeyBindings.value)
  }, [apiKeyBindings.value])

  return (
    <div>
      <nav>
        <div>
          <img src={logo} />
          <span>Chapity (v{getExtensionVersion()})</span>
        </div>
      </nav>
      <main>
        <code>{JSON.stringify(config)}</code>
        <div>
          <Tabs initialValue="1">
            <Tabs.Item label="APIs" value="1">
              <div>
                <h2>OpenAI</h2>

                <Input
                  htmlType="password"
                  label="OpenAI API Key"
                  scale={1.5}
                  {...apiKeyBindings}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <>{JSON.stringify(savedConfigs)}</>
              </div>
            </Tabs.Item>
            <Tabs.Item label="Profile" value="2">
              <div>
                <h2>Profile</h2>
                <Input
                  htmlType="text"
                  label="Full Name"
                  scale={1.5}
                  {...nameKeyBindings}
                  placeholder="Your Name"
                />
              </div>
            </Tabs.Item>
          </Tabs>
          <Button onClick={onSave}>Save</Button>
        </div>
        {/* <EngineSelect /> */}
      </main>
    </div>
  )
}

export default OptionsPage
