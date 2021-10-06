import * as React from 'react'
import { Row, Col, Nav } from 'react-bootstrap'
import MainLayoutPart from '../MainLayoutPart'
import { Link } from 'gatsby'
import { MainFooterRow, FooterNav, BottomRow } from './styledFooter'
import { footerQuery, websiteDatenQuery } from './footerQuery'

export const Footer = ({ topMenu, websiteDaten }) => {
// console.log('Top Menu', topMenu)
  // console.log('Website Daten from footer', websiteDaten)

  const footerContent = (
    <footer>
      <Row>
        <Col>
          <FooterNav className="flex-column">
            {topMenu.body.map((nav, i) => {
              return (
                <Nav.Item key={i}>
                  <Link to={nav.primary.nav_link.url} className="nav-link">
                    {nav.primary.link_text}
                  </Link>
                </Nav.Item>
              )
            })}
          </FooterNav>
        </Col>
        <Col></Col>
      </Row>
      <BottomRow className="mt-3 mt-md-4">
        <Col>
          <p className="copyright">
            &copy; {new Date().getFullYear()} {websiteDaten.branding}
          </p>
        </Col>
      </BottomRow>
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
