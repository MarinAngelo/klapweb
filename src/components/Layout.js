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
  --footer-color: black;
  --footer-hover-color: pink;
}

body {
    color: #718075;
    background: #E1FFE9;
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

  p, li {
    font-size: 1.6rem;
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
