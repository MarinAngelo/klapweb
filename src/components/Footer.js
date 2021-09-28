import * as React from 'react'
import { Row, Col } from 'react-bootstrap'
import MainLayoutPart from './MainLayoutPart'
import styled from 'styled-components'

export const Footer = () => {

  const footerContent = (
    <footer>
      <p className="copyright">
        &copy; {new Date().getFullYear()} Klap-Web
      </p>
    </footer>
  )

  return (
    <>
    <MainFooterRow>
      <Col>
    <MainLayoutPart content={footerContent} />
      </Col>
    </MainFooterRow>
    </>
  )
}

const MainFooterRow = styled(Row)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
background-color: silver;
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {

}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  margin-top: 10rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`
