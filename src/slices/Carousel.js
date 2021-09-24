import * as React from 'react'
import { graphql } from 'gatsby'
import ImageSlider from 'react-bootstrap/Carousel'
import styled from 'styled-components'
import { RichText } from 'prismic-reactjs'
import { Row, Col } from 'react-bootstrap'
import SectionTitle from '../components/SectionTitle'

const StyledImageSlider = styled(ImageSlider)`
  margin-left: -12px;
  margin-right: -12px;
`

export const Carousel = ({ slice }) => {
    console.log('Carousel data', slice)

    return (
      <>
        <SectionTitle title={slice.primary.section_title.raw} style={{color: "white"}} />
      <Row className="mt-4 mt-md-5 mb-4 mb-md-5" style={{background: "black", padding: "5vw"}}>
          <Col md={1}></Col>
          <Col>
        <StyledImageSlider>
          {slice.items.map((slice, i) => (
            <ImageSlider.Item key={i}>
              <a href={slice.link.url} target="_blank">
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
        </Col>
        <Col md={1}></Col>
        </Row>
        </>
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
