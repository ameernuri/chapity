interface Props {
  fill?: string
}

const NWTriangle = ({ fill = '#000' }: Props) => (
  <svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="0 0 9.04 9.04"
  >
    <polygon points="0,0 9.04,0 0,9.04 " />
  </svg>
)

export default NWTriangle
