interface Props {
  stroke?: string
  style?: any
}

const SEResize = ({ stroke = 'transparent', style = {} }: Props) => (
  <svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="0 0 9.04 9.04"
    style={style}
  >
    <polyline
      fill="none"
      strokeWidth={0.5}
      stroke={stroke}
      points="7.57,0.47 7.57,7.57 0.47,7.57 "
    />
    <polyline
      fill="none"
      strokeWidth={0.5}
      stroke={stroke}
      points="4.57,0.47 4.57,4.57 0.47,4.57 "
    />
  </svg>
)

export default SEResize
