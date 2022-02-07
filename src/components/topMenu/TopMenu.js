import * as React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import { query } from './topMenuQuery'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
// import { LanguageSwitcher } from './LanguageSwitcher'
import { useLocation } from '@reach/router'
import { StyledNavItem, StyledNavbarToggle, StyledNavbar } from './styledTopMenu'

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

  const logo = (<img
    src={topMenu.logo.url}
    // height="65"
    className="d-inline-block align-top"
    alt={topMenu.logo.alt}
    width="100%"
  />)
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
          <Navbar.Brand>
              {topMenu.logo.url !== null ? logo : topMenu.branding}
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
                    <StyledNavItem key={i} active={pathname === nav.primary.nav_link.url ? "active" : null}>
                      <Link to={nav.primary.nav_link.url} className="nav-link">
                        {nav.primary.link_text}
                      </Link>
                    </StyledNavItem>
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

