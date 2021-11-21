import * as React from 'react'
import { Row, Col, Nav } from 'react-bootstrap'
import MainLayoutPart from '../MainLayoutPart'
import { Link } from 'gatsby'
import { MainFooterRow, FooterNav, BottomRow, AddressCol } from './styledFooter'
// import { footerQuery, websiteDatenQuery } from './footerQuery'

export const Footer = ({ topMenu, websiteDaten }) => {
  // console.log('Top Menu', topMenu)
  // console.log('Website Daten from footer', websiteDaten)

  // If not translated fallback
  const siteData = websiteDaten || {}

  // Defaut Values
  const webDev = websiteDaten.web_dev ? websiteDaten.web_dev : "Webentwicklung"
  const contactDataTitle = websiteDaten.contact_data_title ? websiteDaten.contact_data_title : "Kontakt Daten"
  const privacyPolicy = websiteDaten.privacy_policy ? websiteDaten.privacy_policy : "Datenschutzerklärung"
  console.log('Web Def', webDev)
  
  const footerContent = (
    <footer>
      <Row>
        <Col xs={12} md={6} className="d-flex justify-content-center">
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
        <AddressCol xs={12} md={6} className="d-flex justify-content-center">
          <div className="address-block"> 
          <h4>{contactDataTitle}</h4>
          <address>
            {siteData.branding}<br />
            {siteData.street}<br />
            {siteData.zip_code} {siteData.place}<br />
            <a href={`mailto:${siteData.email}`}>{siteData.email}</a>
          </address>
          </div>
        </AddressCol>
      </Row>
      <BottomRow className="mt-3 mt-md-4">
        <Col xs={12} md={4} className="d-flex justify-content-center">
          <Link to="/datenschutzerklaerung" className="buttom-row-link">{privacyPolicy}</Link>
        </Col>
        <Col xs={12} md={4} className="d-flex justify-content-center">
          <p>
            {webDev}: <a href="https://klap-web.ch/">klap-web.ch</a>
          </p>
        </Col>
        <Col xs={12} md={4} className="d-flex justify-content-center">
          <p className="copyright">
            &copy; {new Date().getFullYear()} {siteData.branding}
          </p>
        </Col>
      </BottomRow>
    </footer>
  )

  return (
    <>
      <MainFooterRow>
        <Col>
          <MainLayoutPart content={footerContent} doNotUseLinkStyles={true}/>
        </Col>
      </MainFooterRow>
    </>
  )
}
