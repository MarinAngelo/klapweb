import * as React from 'react'
import { useState, useEffect } from 'react'
import { Link, graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import { StaticImage } from 'gatsby-plugin-image'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import { LanguageSwitcher } from './LanguageSwitcher'
import styled from 'styled-components'

const StyledNavbar = styled(Navbar)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
background-color: ${props => props.scrolled ? "silver" : null};
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {

}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {

}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`

export const TopMenu = ({ topMenu, activeDocMeta }) => {

  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      setScroll(window.scrollY > 150);
    });
  }, []);
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
      <StyledNavbar expand="lg" fixed="top" scrolled={scroll ? 1 : 0}>
        <Container>
          <Link to="/" className="nav-link">
          <Navbar.Brand>{topMenu.branding}</Navbar.Brand>
          </Link>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
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
                <LanguageSwitcher activeDocMeta={activeDocMeta} />
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
