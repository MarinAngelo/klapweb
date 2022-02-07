import styled from 'styled-components'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'

const StyledNavbar = styled(Navbar)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
background-color: ${props => props.pathname !== "/" ? "var(--header-bg-color)"
        : props.expanded ? "var(--header-bg-color)"
            : props.scrolled ? "var(--header-bg-color)"
                : "transparent"};
transition-timing-function: ease-in;
transition: 2s;

img{
  margin-left: 0;
  height: ${props => props.pathname !== "/" ? "35px"
        : props.expanded ? "35px"
            : props.scrolled ? "35px"
                : "45px"}
}

.navbar-toggler{
  border: 10rem;
}

.navbar-brand {
  color: var(--header-color);

  &:hover {
    color: var(--header-color) !important;
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
    img{
    margin-left: 1.2rem;
    height: 55px;
  }
  #basic-navbar-nav {
    margin-right: 4rem;
  }

  a.nav-link {
    font-size: 1rem !important;
  }
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {
  a.nav-link {
    font-size: 1.3rem !important;
  }

}
`
const StyledNavbarToggle = styled(Navbar.Toggle)`
  background-color: ${props => props.pathname !== "/" ? "var(--header-bg-color)" : "transparent"};
  border: 0;
  &:focus {
    outline: none;
    border: 0;
    box-shadow: none;
  }

  span.navbar-toggler-icon{
    background-image: ${props => props.pathname !== "/" ? "var(--toggler-url-light)" : props.scrolled ? "var(--toggler-url-light)" : "var(--toggler-url-dark)"};
  }
`
const StyledNavItem = styled(Nav.Item)`

  a.nav-link {
    text-decoration: ${props => props.active === "active" ? 'underline' : 'none'};
    font-size: 1.2rem;
    color: var(--header-color) !important;

    &:hover {
      color: var(--footer-hover-color) !important;
      text-decoration: underline;
    }
  }
`

export { StyledNavItem, StyledNavbarToggle, StyledNavbar }