import * as React from 'react'
import { graphql } from 'gatsby'
import ImageSlider from 'react-bootstrap/Carousel'
import styled from 'styled-components'
import { RichText } from 'prismic-reactjs'

const StyledImageSlider = styled(ImageSlider)`
  margin-left: -15px;
  margin-right: -15px;
`

export const Carousel = ({ slice }) => {
    console.log('Carousel data', slice)

    return (
        <div>
        {/* <SectionTitle title={slice.primary.section_title} /> */}
        <StyledImageSlider>
          {slice.items.map((slice, i) => (
            <ImageSlider.Item key={i}>
              <a href={slice.link}>
                <img
                  className="d-block w-100"
                  src={slice.image.url}
                  alt={slice.alt}
                />
              </a>
              <ImageSlider.Caption>
                <RichText render={slice.caption_title.raw} />
                <RichText render={slice.caption_text.raw} />
              </ImageSlider.Caption>
            </ImageSlider.Item>
          ))}
        </StyledImageSlider>
        </div>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyCarousel on PrismicHomepageDataBodyCarousel {
slice_type
items {
              alt
              caption_text {
                raw
              }
              caption_title {
                raw
              }
              image {
                url
              }
              link {
                url
              }
            }
            primary {
              section_title {
                raw
              }
            }
}
`
