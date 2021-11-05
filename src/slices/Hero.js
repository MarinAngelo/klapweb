import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'

export const Hero = ({ slice }) => {
    console.log('Hero data', slice)
    const mainImg = slice.primary.background_image.localFile.childImageSharp.gatsbyImageData
    const thumbImgs = slice.primary.background_image.thumbnails
    console.log('thumbImgs', thumbImgs)
    return (
        <PageCover className="d-flex position-relative"
            mobileImg={mainImg.images.fallback.src}
            mobileLsImg={thumbImgs.mobile_ls.localFile.childImageSharp.gatsbyImageData.images.fallback.src}
            desktopImg={thumbImgs.desktop.localFile.childImageSharp.gatsbyImageData.images.fallback.src}
            tabletImg={thumbImgs.tablet.localFile.childImageSharp.gatsbyImageData.images.fallback.src}
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
  background-image: linear-gradient(to bottom, rgba(35,36,66, 0.9), rgba(94,95,170, 0.3)),
                    url(${props => props.mobileImg});
  background-color: black;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  margin: 0 -12px 0 -12px;
  height: 101vh !important;
  
  .cover-text-box{
    background-color: rgba(94,95,170, 0.3) !important;
    color: #a9a9da;
    /* center the inner div */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .cover-text{
    text-align: center;
  }
  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
    background-image: url(${props => props.mobileLsImg});
    
    .cover-text-box {
      min-height: 35vh;
      min-width: 50vw;
      position: absolute;
      top: 20vh;
      left: 8vw;
      border-radius: 40px;
      padding-top: 2rem;
      padding-bottom: 2rem;
      color: #DFE2E8;
    }
    
    .cover-text h1{
      font-size: 1.3rem;
    }
    
    .cover-text h2{
      font-size: 1.2rem;
      margin-top: 0;
      padding-top: 1rem;
    }
    
    .cover-text {
      width:90%;
    }
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
    background-image: url(${props => props.tabletImg});

    .cover-text-box{
      min-width: 40vw;
      position: absolute;
      top: 25vh;
      left: 10vw;
    }
    
    .cover-text h1{
      font-size: 2.3rem;
    }
    
    .cover-text h2{
      font-size: 1.6rem;
    }
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
    background-image: url(${props => props.desktopImg});
    height: calc(100vh - 55px); // minus hight of navbar

    .cover-text-box{
      min-width: 40vw;
      position: absolute;
      top: 25vh;
      left: 10vw;
    }

        .cover-text h1{
      font-size: 2.3rem;
    }

    .cover-text h2{
      font-size: 1.6rem;
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
                              localFile {
                  childImageSharp {
                    gatsbyImageData(quality: 60)
                  }
                }
                thumbnails {
                  desktop {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                  mobile_ls {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                  tablet {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                }
            }
          }
        }`