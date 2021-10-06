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
        <Col>
            <h3>Kontakt Daten</h3>
            <address>
              {websiteDaten.branding}<br />
              {websiteDaten.street}<br />
              {websiteDaten.zip_code} {websiteDaten.place}<br />
            <a href={`mailto:${websiteDaten.email}`}>{websiteDaten.email}</a>
              </address>
        </Col>
      </Row>
      <BottomRow className="mt-3 mt-md-4">
        <Col>
          <p className="copyright">
            &copy; {new Date().getFullYear()} {websiteDaten.branding}
          </p>
        </Col>
        <Col>
          <Link to="/datenschutzerklaerung">Datenschutzerklärung</Link>
        </Col>
        <Col>
            <p>
            Webentwicklung: <a href="https://klap-web.ch/">Klap-Web</a>
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
