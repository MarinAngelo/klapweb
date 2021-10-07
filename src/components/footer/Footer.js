import * as React from 'react'
import { Row, Col, Nav } from 'react-bootstrap'
import MainLayoutPart from '../MainLayoutPart'
import { Link } from 'gatsby'
import { MainFooterRow, FooterNav, BottomRow } from './styledFooter'
import { footerQuery, websiteDatenQuery } from './footerQuery'

export const Footer = ({ topMenu, websiteDaten }) => {
  // console.log('Top Menu', topMenu)
  // console.log('Website Daten from footer', websiteDaten)

  // If not translated fallback
  const siteData = websiteDaten || {}

  const footerContent = (
    <footer>
      <Row>
        <Col>
          <FooterNav className="flex-column">
            {topMenu.body.map((nav, i) => {
              // If not translated fallback
              const navLink = nav.primary.nav_link || {}
              return (
                <Nav.Item key={i}>
                  <Link to={navLink.url} className="nav-link">
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
            {siteData.branding}<br />
            {siteData.street}<br />
            {siteData.zip_code} {siteData.place}<br />
            <a href={`mailto:${siteData.email}`}>{siteData.email}</a>
          </address>
        </Col>
      </Row>
      <BottomRow className="mt-3 mt-md-4">
        <Col>
          <p className="copyright">
            &copy; {new Date().getFullYear()} {siteData.branding}
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
