import styled from 'styled-components'
import { Nav, Row, Col } from 'react-bootstrap'


const AddressCol = styled(Col)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
.address-block{
  text-align: center;
  margin-top: 1.5rem;
}

color: var(--footer-color);

a {
  color: var(--footer-color);

  &:hover{
    color: var(--footer-hover-color);
  }
}
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {
  
}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {
  
}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  .address-block {
    text-align: left;
    margin-top: 0.5rem;
  }
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`

const BottomRow = styled(Row)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
color: var(--footer-color);

a {
  color: var(--footer-color);
  &:hover{
    color: var(--footer-hover-color);
  }
}

.buttom-row-link {
  font-size: small;
  margin-bottom: 1rem;
}

p {
  font-size: small;
  text-align: center;
}
  margin-bottom: -1rem;
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {

}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  margin-bottom: -2.5rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`
const FooterNav = styled(Nav)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
color: var(--footer-color);

a {
  color: var(--footer-color);
  &:hover{
    color: var(--footer-hover-color);
  }
}
.nav-link{
  line-height: .8;
}
text-align: center;
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {
}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
 text-align: left;
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
background-color: var(--footer-bg-color);
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

export { MainFooterRow, FooterNav, BottomRow, AddressCol }