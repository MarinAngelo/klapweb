import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'

const PageCover = styled.section`
    background-image: url(${props => props.bgImage});
    background-color: black;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    height: calc(100vh - 55px); // minus hight of navbar
    margin: 0 -12px 0 -12px;

    .cover-text-box{
        background-color: rgba(115, 136, 172, 0.6);
        color: #DFE2E8;
        height: 40vh;
        min-width: 40vw;
        position: absolute;
        top: 10rem;
        left: 10rem;
        border-radius: 40px;
    }

    .cover-text{
        position: absolute;
        top: 50%;
        -ms-transform: translateY(-50%);
        transform: translateY(-50%);
    }
`

export const Hero = ({ slice }) => {
    console.log('Hero data', slice)
    return (
        <PageCover className="d-flex position-relative"
            bgImage={slice.primary.background_image.url}
        >
            <div className="cover-text-box">
                <div className="cover-text p-5">
                <RichText render={slice.primary.hero_title.raw || []} />
                <RichText render={slice.primary.hero_content.raw || []} />
                </div>
            </div>
        </PageCover>
    )
}

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