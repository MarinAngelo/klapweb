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
    font-family: ${props => props.pathname === "/janos" ? 'Rubik Beastly' : props.pathname === "/carla" ? 'Indie Flower' : "Codystar"};
    font-weight: ${props => props.pathname === "/janos" ? null : props.pathname === "/carla" ? null : "bold"};
    /* font-family: 'Indie Flower', cursive; */
    p {
        padding: 1rem;
    }
    background-color: ${props => props.pathname === "/janos" ? "#1d186c" : props.pathname === "/carla" ? "#ff003bb0" : "#a32eb1"};
    color: ${props => props.pathname === "/janos" ? "#2bcd92" : props.pathname === "/carla" ? "#00806fd1" : "#cbff00"};
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
