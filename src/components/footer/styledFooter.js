import styled from 'styled-components'
import { Nav, Row } from 'react-bootstrap'

const BottomRow = styled(Row)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
p {
  color: red;
  font-size: small;
  text-align: center;
}
  margin-bottom: -2rem;
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {

}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  margin-bottom: -3rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`
const FooterNav = styled(Nav)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
.nav-link{
  color: red;
  line-height: .8;
}
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {
}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
.nav-link{
  line-height: 1.2;
  /* to make menu items inline with rest of document */
  text-indent: -.9rem;
}
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`

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

export { MainFooterRow, FooterNav, BottomRow }