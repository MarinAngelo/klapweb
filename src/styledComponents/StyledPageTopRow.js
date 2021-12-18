import { Row } from 'react-bootstrap'
import styled from 'styled-components'


const PageTopRow = styled(Row)`
  // Extra small devices (portrait phones, less than 576px)
  // No media query for xs since this is the default in Bootstrap
  margin-top: 10vh;
  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
  
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
  
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
    margin-top: 15vh !important;
  }
  // Extra large devices (large desktops, 1200px and up, col-xl)
  @media (min-width: 1200px) {
  
  }
  `

  export default PageTopRow;