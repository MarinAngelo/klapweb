import * as React from 'react'
import { Link, graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import { StaticImage } from 'gatsby-plugin-image'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import { LanguageSwitcher } from './LanguageSwitcher'

export const TopMenu = ({ topMenu, activeDocMeta }) => {
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
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
              <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
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
              uid
            }
          }
          slice_type
        }
        ... on PrismicTopMenuDataBody2ndLevel {
          slice_type
          primary {
            link_text
            nav_link {
              lang
              uid
            }
          }
          items {
            third_level_link_text
            third_level_link {
              lang
              uid
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
