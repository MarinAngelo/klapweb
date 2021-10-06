import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'

import { repositoryConfigs } from '../utils/prismicPreviews'

import { Layout } from '../components/Layout'
import { SliceZone } from '../components/SliceZone'

const HomepageTemplate = ({ data }) => {
  if (!data) return null
  
  console.log('homepage data', data)
  const homepage = data.prismicHomepage || {}
  const topMenu = data.prismicTopMenu || {}
  const websiteDaten = data.prismicWebsiteDaten || {}

  const { lang, type, url } = homepage || {}
  const alternateLanguages = homepage.alternate_languages || []
  const activeDoc = {
    lang,
    type,
    url,
    alternateLanguages,
  }

  return (
    <Layout topMenu={topMenu.data} activeDocMeta={activeDoc} websiteDaten={websiteDaten.data}>
      <SliceZone slices={homepage.data.body} />
    </Layout>
  )
}

export const query = graphql`
  query homepageQuery($lang: String) {
    prismicHomepage(lang: { eq: $lang }) {
      _previewable
      alternate_languages {
        uid
        type
        lang
      }
      lang
      url
      type
      data {
        body {
          ... on PrismicSliceType {
            id
            slice_type
            slice_label
          }
          ...PrismicHomepageDataBodyHero
          ...PrismicHomepageDataBodyCallToActionGrid
          ...PrismicHomepageDataBodyAnrisstext
          ...PrismicHomepageDataBodyCarousel
          #...HomepageDataBodyEmailSignup
          #...HomepageDataBodyFullWidthImage
          #...HomepageDataBodyHeadlineWithButton
          #...HomepageDataBodyInfoWithImage
          #...HomepageDataBodyTextInfo
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

export default withPrismicPreview(HomepageTemplate, repositoryConfigs)
