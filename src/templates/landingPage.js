import * as React from 'react'
import { graphql } from 'gatsby'
import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'
import { repositoryConfigs } from '../utils/prismicPreviews'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'
import { useLocation } from '@reach/router'

const StyledCenterDiv = styled.div`
    font-size: 1.6rem;
    text-align: center;
    font-family: 'Indie Flower', cursive;
    p {
        padding: 1rem;
    }
    background-color: ${props => props.pathname === "/janos" ? "black" : props.pathname === "/carla" ? "#ff003bb0" : "blue"};
    color: ${props => props.pathname === "/janos" ? "red" : props.pathname === "/carla" ? "#00806fd1" : "red"};
`

const LandingPageTemplate = ({ data }) => {
    console.log('LandingPage data', data.prismicLandingPage.data.text)

    const { pathname } = useLocation();
    console.log('Pathname', pathname)

    if (!data) return null

    return (
        <StyledCenterDiv 
            className="d-flex align-items-center justify-content-center" 
            style={{ height: "100vh", width: "100vw" }}
            pathname={pathname}
            >
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
