import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { Helmet } from 'react-helmet'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col } from 'react-bootstrap'
import { createGlobalStyle } from "styled-components"

import { TopMenu } from './TopMenu'
import { Footer } from './footer/Footer'
import { websiteDatenQuery } from './footer/footerQuery';

import { darkenLighten } from '../utils/ColorAdjust'

const pageColor = "#5e5faa"
const pageBgColor = "#c7c8ff"
const pageLinkColor = "#8b1a8b"
const pageBgColorDarker = darkenLighten(pageBgColor, -2)
const pageColorDarker = darkenLighten(pageColor, 100)
const pageBgColorDark = darkenLighten(pageBgColor, -10)
const pageColorDark = darkenLighten(pageColor, 90)
const pageLinkColorDarker = darkenLighten(pageLinkColor, -40)

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
  --footer-color: #aeafff;
  --footer-bg-color: #232442;
  --footer-hover-color: #dcdcff;
  --header-bg-color: #232442;
  --header-color: #ceceff;
  --secondary-bg-color-light: #ffbe97;
  --secondary-bg-color-dark: #d5895a;
  --secondary-color-dark: #973a00;
  --page-button-hover-bg-color: #80b580;
  --toggler-url-dark: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='blueviolet' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
  --toggler-url-light: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='hotpink' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
}

body {
    color: var(--page-color);
    background: var(--page-bg-color);
    height: 100vh !important;
    font-family: 'Poppins';
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
  console.log('website daten from layout', websiteDaten)
  const queryData = useStaticQuery(graphql`
    query SiteQuery {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `)

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
        pageColor={pageColor}
        pageBgColor={pageBgColor}
        pageColorDarker={pageColorDarker}
        pageColorDark={pageColorDark}
        pageBgColorDark={pageBgColorDark}
        pageBgColorDarker={pageBgColorDarker}
        pageLinkColor={pageLinkColor}
        pageLinkColorDarker={pageLinkColorDarker}
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
