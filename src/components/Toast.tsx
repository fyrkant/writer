interface Props {
  msg: string
  type: 'success' | 'error'
  visible: boolean
}

export default function Toast({ msg, type, visible }: Props) {
  return (
    <div id="toast" className={visible ? `show ${type}` : ''}>
      {msg}
    </div>
  )
}
