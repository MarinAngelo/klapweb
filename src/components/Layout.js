import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { Helmet } from 'react-helmet'
import { getLCP, getFID, getCLS } from 'web-vitals';
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col } from 'react-bootstrap'
import { createGlobalStyle } from "styled-components"

import { TopMenu } from './TopMenu'
import { Footer } from './footer/Footer'
import { websiteDatenQuery } from './footer/footerQuery';

const GlobalStyle = createGlobalStyle`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
html {
  --page-color: #5e5faa;
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
    background: #c7c8ff;
  }

  h2 {
    margin-top: 3rem;
  }

  h3 {
    margin-top: 1.8rem;
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
    
    h3 {
      margin-bottom: 1.5rem;
    }
    
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

  // web vitals
  /*     getCLS(console.log);
      getFID(console.log);
      getLCP(console.log); */

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
      <GlobalStyle />
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
