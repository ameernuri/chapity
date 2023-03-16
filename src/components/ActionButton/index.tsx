import { ComponentPropsWithRef, ReactNode } from 'react'
import './style.scss'

// add props of button
type Props = ComponentPropsWithRef<'button'> & {
  children: ReactNode | ReactNode[]
}

const ActionButton = ({ children, ...buttonProps }: Props) => {
  return (
    <button className="action-button" {...buttonProps}>
      {children}
    </button>
  )
}

export default ActionButton
