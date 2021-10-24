import * as React from 'react'
import { useState, useEffect } from 'react'
import { Link, graphql } from 'gatsby'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
// import { LanguageSwitcher } from './LanguageSwitcher'
import styled from 'styled-components'
import { useLocation } from '@reach/router'

export const TopMenu = ({ topMenu, activeDocMeta }) => {
  console.log('Top Menu Data', topMenu)
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      setScroll(window.scrollY > 150);
    });
  }, []);

  const [expanded, setExpanded] = useState(false);

  const { pathname } = useLocation();
  // console.log('Top Menu', topMenu);
/*   const renderedMenuLinks = topMenu.menu_links
? topMenu.menu_links.map((menuLink, index) => (
  <li key={`top-nav-${index}`}>
  <Link id={menuLink.link.id} to={menuLink.link.url}>
  {RichText.asText(menuLink.label.raw)}
  </Link>
  </li>
  ))
  : null */

  return (
    <header>
      <StyledNavbar 
        expand="lg" 
        fixed="top" 
        scrolled={scroll ? 1 : 0} 
        pathname={pathname}
        expanded={expanded}
        >
        <Container fluid>
          <Link to="/" className="nav-link">
          {/* <Navbar.Brand>{topMenu.branding}</Navbar.Brand> */}
          <Navbar.Brand>
              <img
                src={topMenu.logo.url}
                // height="65"
                className="d-inline-block align-top"
                alt="Klap Web"
              />
          </Navbar.Brand>
          </Link>
          <StyledNavbarToggle 
          scrolled={scroll ? 1 : 0}
          pathname={pathname} 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(expanded ? false : "expanded")} 
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {/* <Nav.Link href="#home">Home</Nav.Link> */}
              {topMenu.body.map((nav, i) => {
                if(nav.slice_type === "2nd_level") {
                  return (
                <NavDropdown title={nav.primary.link_text} id="basic-nav-dropdown" key={i}>
                  {nav.items.map((navitem, i) => {
                    return (
                      <NavDropdown.Item key={i}> 
                        <Link to={navitem.third_level_link.url} className="nav-link">
                          {navitem.third_level_link_text}
                        </Link>
                      </NavDropdown.Item>
                    )
                  })}
                  {/* <NavDropdown.Divider /> */}
                </NavDropdown>
                  )
                }
                if(nav.slice_type === "1st_level") {
                  return (
                    <Nav.Item key={i}>
                      <Link to={nav.primary.nav_link.url} className="nav-link">
                        {nav.primary.link_text}
                      </Link>
                    </Nav.Item>
                  )
                } else {return null}
              })}
            </Nav>
                {/* <LanguageSwitcher activeDocMeta={activeDocMeta} /> */}
          </Navbar.Collapse>
        </Container>
      </StyledNavbar>
      {/* <div className="menu">
        <Link to="/">
        <StaticImage
        src="../images/logo.png"
        alt="Site logo"
        placeholder="none"
        className="logo"
        />
        </Link>
        </div>
        <div className="menu">
        <ul>
        {renderedMenuLinks}
        <LanguageSwitcher activeDocMeta={activeDocMeta} />
        </ul>
      </div> */}
    </header>
  )
}

export const query = graphql`
fragment TopMenuFragment on PrismicTopMenu {
  _previewable
  data {
    body {
      ... on PrismicTopMenuDataBody1stLevel {
        primary {
          link_text
          nav_link {
            url
          }
        }
        slice_type
      }
      ... on PrismicTopMenuDataBody2ndLevel {
        slice_type
        primary {
          link_text
        }
        items {
          third_level_link_text
          third_level_link {
            lang
            url
          }
        }
      }
    }
    branding
    logo {
      alt
      url
    }
  }
}
`

const StyledNavbar = styled(Navbar)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
background-color: ${props => props.pathname !== "/" ? "var(--header-bg-color)"
                             : props.expanded ? "var(--header-bg-color)" 
                             : props.scrolled ? "var(--header-bg-color)" 
                             : null};
transition-timing-function: ease-in;
transition: 2s;
a.nav-link {
  font-size: 1.4rem;
  color: var(--header-color) !important;
}

img{
  margin-left: 0;
  height: 35px;
}

.navbar-toggler{
  border: 10rem;
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
    font-size: 1.6rem !important;
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
`;