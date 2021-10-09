import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'
import { Container } from 'react-bootstrap'

export const Hero = ({ slice }) => {
  // console.log('Hero data', slice)
  return (
    <PageCover className="d-flex position-relative"
      bgImage={slice.primary.background_image.url}
    >
      <div className="cover-text-box">
        <div className="cover-text">
          <RichText render={slice.primary.hero_title.raw || []} />
          <RichText render={slice.primary.hero_content.raw || []} />
        </div>
      </div>
    </PageCover>
  )
}
const PageCover = styled.section`
  // Extra small devices (portrait phones, less than 576px)
  // No media query for xs since this is the default in Bootstrap
  background-image: url(${props => props.bgImage});
  background-color: black;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  margin: 0 -12px 0 -12px;
  height: 101vh !important;

  .cover-text-box{
      background-color: rgba(94,95,170, 0.3) !important;
      color: #DFE2E8;
      display: flex;
      justify-content: center;
      align-items: center;
    }

  .cover-text{
    text-align: center;
    }
  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
    
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
    
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
    
    height: calc(100vh - 55px); // minus hight of navbar
    .cover-text-box{
      background-color: rgba(94,95,170, 0.6);
      color: #DFE2E8;
      min-height: 35vh;
      min-width: 40vw;
      position: absolute;
      top: 25vh;
      left: 10vw;
      border-radius: 40px;
      /* center the inner div */
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .cover-text{
      width:85%;
    }
  }
  
  // Extra large devices (large desktops, 1200px and up, col-xl)
  @media (min-width: 1200px) {
  
  }
  `

export const query = graphql`
  fragment PrismicHomepageDataBodyHero on PrismicHomepageDataBodyHero {
              slice_type
          primary {
            hero_content {
              html
              raw
              text
            }
            hero_title {
              text
              html
              raw
            }
            background_image {
              url
            }
          }
        }`