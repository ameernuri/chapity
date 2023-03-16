interface Props {
  fill?: string
  stroke?: string
  style?: any
}

const SETriangle = ({ fill = '#000', stroke = 'transparent', style = {} }: Props) => (
  <svg version="1.1" viewBox="0 0 9.04 9.04" style={style}>
    <polygon fill={fill} stroke={stroke} points="9.04,9.04 0,9.04 9.04,0 " />
  </svg>
)

export default SETriangle
