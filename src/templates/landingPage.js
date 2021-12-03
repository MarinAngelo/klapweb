import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'
import { repositoryConfigs } from '../utils/prismicPreviews'

const LandingPageTemplate = ({ data }) => {
    console.log('Page data', data)
    if (!data) return null

    return (
        <h1>Hallo Landing Page</h1>
    )
}

export const query = graphql`
query landingPageQuery($id: String, $lang: String) {
  prismicLandingPage(id: { eq: $id }, lang: { eq: $lang }) {
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
      text {
          raw
        }
      }
      uid
    }
  }
`

export default withPrismicPreview(LandingPageTemplate, repositoryConfigs)
