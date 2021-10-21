import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'

import { repositoryConfigs } from '../utils/prismicPreviews'

import { Layout } from '../components/Layout'
import { SliceZone } from '../components/SliceZone'
import { PageTitle } from '../components/PageTitle'
import { PageContent } from '../components/PageContent'
import { Row, Col } from 'react-bootstrap'
import styled from 'styled-components'

const PageTemplate = ({ data }) => {
  console.log('Page data', data)
  if (!data) return null

  const pageContent = data.prismicPage
  const page = pageContent.data || {}

  const { lang, type, url } = pageContent
  const alternateLanguages = pageContent.alternate_languages || []
  const activeDoc = {
    lang,
    type,
    url,
    alternateLanguages,
  }

  const topMenu = data.prismicTopMenu || {}
  const websiteDaten = data.prismicWebsiteDaten || {}

  return (
    <Layout topMenu={topMenu.data} activeDocMeta={activeDoc} websiteDaten={websiteDaten.data}>
      {/* Without english version build error */}
      {data.prismicPage.data.page_title.raw[0].text !== "" ?
        <PageTopRow>
          <Col>
            <PageTitle pageTitle={data.prismicPage.data.page_title.raw} />
            <PageContent pageContent={data.prismicPage.data.content.raw} />
          </Col>
        </PageTopRow>
        : null
      }
      <Row style={{ marginTop: "-6rem" }}>
        <Col>
          <SliceZone slices={page.body} />
        </Col>
      </Row>
    </Layout>
  )
}

const PageTopRow = styled(Row)`
  // Extra small devices (portrait phones, less than 576px)
  // No media query for xs since this is the default in Bootstrap
  margin-top: 10vh;
  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
  
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
  
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
    margin-top: 15vh;
  }
  // Extra large devices (large desktops, 1200px and up, col-xl)
  @media (min-width: 1200px) {
  
  }
  `
export const query = graphql`
query pageQuery($id: String, $lang: String) {
  prismicPage(id: { eq: $id }, lang: { eq: $lang }) {
    _previewable
    url
    uid
    type
    id
    lang
    alternate_languages {
      id
      type
      lang
      uid
    }
    data {
      page_title {
        raw
      }
      content {
        raw
        html
      }
      body {
        ... on PrismicSliceType {
          id
          slice_label
          slice_type
        }
        ...PrismicPageDataBodyPreisliste
        ...PrismicPageDataBodyHtmlInhalte
        ...PrismicPageDataBodyBildUndText
        ...PrismicPageDataBodyTextBlock
          #...PageDataBodyEmailSignup
          #...PageDataBodyFullWidthImage
          #...PageDataBodyHeadlineWithButton
          #...PageDataBodyInfoWithImage
          #...PageDataBodyTextInfo
        }
      }
    }
    prismicTopMenu(lang: { eq: $lang }) {
      ...TopMenuFragment
    }
    prismicWebsiteDaten(lang: { eq: $lang }) {
      ...WebsiteDatenFragment
    }
  }
`

export default withPrismicPreview(PageTemplate, repositoryConfigs)
