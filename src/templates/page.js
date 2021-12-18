import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'

import { repositoryConfigs } from '../utils/prismicPreviews'

import { Layout } from '../components/Layout'
import { Row, Col } from 'react-bootstrap'
import { SliceZone } from '../components/SliceZone'
import { PageTitle } from '../components/PageTitle'
import { PageContent } from '../components/PageContent'
import PageTopRow from '../styledComponents/StyledPageTopRow'
import SEO from '../components/seo'

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
      <SEO
        title={pageContent.data.site_meta_title}
        description={pageContent.data.site_meta_description}
        article
      />
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
      <Row>
        <Col>
          <SliceZone slices={page.body} />
        </Col>
      </Row>
    </Layout>
  )
}

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
      site_meta_description
        site_meta_title
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
        ...PrismicPageDataBodyAkkordeon
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
