import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'
import { Container } from 'react-bootstrap'

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
  display: none;
}
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {
  
}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {
  
}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  
}

height: calc(100vh - 55px); // minus hight of navbar
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
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}
`
export const Hero = ({ slice }) => {
    // console.log('Hero data', slice)
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