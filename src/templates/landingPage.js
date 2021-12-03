import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'
import { repositoryConfigs } from '../utils/prismicPreviews'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'

const StyledCenterDiv = styled.div`
    background-color: black;
    color: blueviolet;
`

const LandingPageTemplate = ({ data }) => {
    console.log('LandingPage data', data.prismicLandingPage.data.text)
    if (!data) return null

    return (
        <StyledCenterDiv className="d-flex align-items-center justify-content-center" style={{ height: "100vh", width: "100vw" }}>
            <RichText render={data.prismicLandingPage.data.text.raw} />
        </StyledCenterDiv>
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
