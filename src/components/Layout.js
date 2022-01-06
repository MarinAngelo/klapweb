import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { Helmet } from 'react-helmet'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col } from 'react-bootstrap'
import { createGlobalStyle } from "styled-components"

import { TopMenu } from './TopMenu'
import { Footer } from './footer/Footer'

import { darkenLighten } from '../utils/ColorAdjust'

const defaultTheme = {
  pageColor: "grey",
  pageBgColor: "AliceBlue",
  pageLinkColor: "blue",
  headerColor: "white",
  headerBgColor: "grey",
  footerColor: "white",
  footerBgColor: "grey"
}

const GlobalStyle = createGlobalStyle`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
html {
  --page-color: ${props => props.pageColor};
  --page-color-dark: ${props => props.pageColorDark};
  --page-color-darker: ${props => props.pageColorDarker};
  --page-bg-color: ${props => props.pageBgColor};
  --page-bg-color-dark: ${props => props.pageBgColorDark};
  --page-bg-color-darker: ${props => props.pageBgColorDarker};
  --page-link-color: ${props => props.pageLinkColor};
  --page-link-color-darker: ${props => props.pageLinkColorDarker};
  --header-color: ${props => props.headerColor};
  --header-color-lighter: ${props => props.headerColorLighter};
  --header-bg-color: ${props => props.headerBgColor};
  --footer-color: ${props => props.footerColor};
  --footer-bg-color: ${props => props.footerBgColor};
  --toggler-url-dark: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='blueviolet' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
  --toggler-url-light: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='hotpink' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
}

body {
    color: var(--page-color)  ;
    background: var(--page-bg-color);
    height: 100vh !important;
    font-family: ${props => props.mainFont};
  }

  h3 {
    font-weight: 600;
  }

  li.language-switcher {
    font-size: 1.4rem;
  }

  em {
    font-size: .9rem;
  }
  
  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
    
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
    
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
      
    p {
      font-size: 1.6rem;
    }

    li {
      font-size: 1.2rem !important;
    }
  }
  // Extra large devices (large desktops, 1200px and up, col-xl)
  @media (min-width: 1200px) {

}
`
export const Layout = ({ children, topMenu, activeDocMeta, websiteDaten }) => {
  const queryData = useStaticQuery(graphql`
    query SiteQuery {
          prismicTheme {
      ...ThemeFragment
    }
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `)

  console.log('theme', queryData.prismicTheme.data.fonts)

  const fonts = queryData.prismicTheme.data.fonts
  let mainFont = ""
  let titleFont = ""
  let navFont = ""
  let logoFont = ""
  let specFont = ""
  
  for (let index = 0; index < fonts.length; index++) {
    const element = fonts[index];
    switch (element.font_usage){
      case "Hauptschrift":
        mainFont = element.google_font
      case "Überschriften":
        titleFont = element.google_font
      case "Navigation":
        navFont = element.google_font
      case "Logo":
        logoFont = element.google_font
      case "Spezial":
        specFont = element.google_font
    }
  }

  const themePageBgColor = queryData.prismicTheme.data.page_bg_color;
  const themePageColor = queryData.prismicTheme.data.page_color;
  const themePageLinkColor = queryData.prismicTheme.data.page_link_color;
  const themeHeaderColor = queryData.prismicTheme.data.header_color;
  const themeHeaderBgColor = queryData.prismicTheme.data.header_bg_color;
  const themeFooterColor = queryData.prismicTheme.data.footer_color;
  const themeFooterBgColor = queryData.prismicTheme.data.footer_bg_color;

  const pageColorDarker = themePageColor ? darkenLighten(themePageColor, 100) : darkenLighten(defaultTheme.pageColor, 100)
  const pageColorDark = themePageColor ? darkenLighten(themePageColor, 90) : darkenLighten(defaultTheme.pageColor, 90)
  const pageBgColorDarker = themePageBgColor ? darkenLighten(themePageBgColor, -2) : darkenLighten(defaultTheme.pageBgColor, -2)
  const pageBgColorDark = themePageBgColor ? darkenLighten(themePageBgColor, -10) : darkenLighten(defaultTheme.pageBgColor, -10)
  const pageLinkColorDarker = themePageLinkColor ? darkenLighten(themePageLinkColor, -40) : darkenLighten(defaultTheme.pageLinkColor, -40)
  const headerColorLighter = themeHeaderColor ? darkenLighten(themeHeaderColor, 40) : darkenLighten(defaultTheme.headerColor, 40)

  return (
    <>
      <Helmet>
        <html lang="de" />
        {/* Meta Tags */}
        <meta charSet="utf-8" />
        <title>{queryData.site.siteMetadata.title}</title>
        <meta
          name="description"
          content={queryData.site.siteMetadata.description}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css?family=Lato:300,400,700,900"
          rel="stylesheet"
          type="text/css"
        />

        {/* Prismic preview */}
        <script async defer src="https://static.cdn.prismic.io/prismic.js?new=true&repo=klap-web-site"></script>
        {/* Chat Client */}
        <script async type="text/javascript" src="https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/f0e2f54e174840f19a1b945544d388aa8009cfc1bbd84e4e982ffdd4202cd7cd.js"></script>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </Helmet>
      <GlobalStyle 
        pageColor={themePageColor ? themePageColor : defaultTheme.pageColor}
        pageBgColor={themePageBgColor ? themePageBgColor : defaultTheme.pageBgColor}
        pageLinkColor={themePageLinkColor ? themePageLinkColor : defaultTheme.pageLinkColor}
        headerColor={themeHeaderColor ? themeHeaderColor : defaultTheme.headerColor}
        headerBgColor={themeHeaderBgColor ? themeHeaderBgColor : defaultTheme.headerBgColor}
        footerColor={themeFooterColor ? themeFooterColor : defaultTheme.footerColor}
        footerBgColor={themeFooterBgColor ? themeFooterBgColor : defaultTheme.footerBgColor}
        pageColorDarker={pageColorDarker}
        pageColorDark={pageColorDark}
        pageBgColorDark={pageBgColorDark}
        pageBgColorDarker={pageBgColorDarker}
        pageLinkColorDarker={pageLinkColorDarker}
        headerColorLighter={headerColorLighter}
        mainFont={mainFont}
        titleFont={titleFont}
        navFont={navFont}
        logoFont={logoFont}
        specFont={specFont}
      />
      <TopMenu topMenu={topMenu} activeDocMeta={activeDocMeta} />
      <Container fluid >
        <main>
          <Row>
            <Col>
            {children}
            </Col>
          </Row>
        </main>
        <Footer topMenu={topMenu} websiteDaten={websiteDaten} />
      </Container>
    </>
  )
}