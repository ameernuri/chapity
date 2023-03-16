import Wrap from '@src/components/Wrap'
import ChatsProvider from '@src/providers/chats'
import HostProvider from '@src/providers/host'
import UiProvider from '@src/providers/ui'

const ContentScript = () => {
  return (
    <HostProvider>
      <UiProvider>
        <ChatsProvider>
          <Wrap />
        </ChatsProvider>
      </UiProvider>
    </HostProvider>
  )
}

export default ContentScript
