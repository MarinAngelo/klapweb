import * as React from 'react'
import { graphql } from 'gatsby'
import ImageSlider from 'react-bootstrap/Carousel'
import styled from 'styled-components'
import { RichText } from 'prismic-reactjs'
import { Row, Col } from 'react-bootstrap'
import SectionTitle from '../components/SectionTitle'
import 'lazysizes'

const StyledImageSlider = styled(ImageSlider)`
  margin-left: -12px;
  margin-right: -12px;
`

export const Carousel = ({ slice }) => {
    // console.log('Carousel data', slice)

    return (
      <>
        <SectionTitle title={slice.primary.section_title.raw} style={{color: "white"}} />
      <Row className="mt-4 mt-md-5 mb-4 mb-md-5" style={{background: "black", padding: "5vw"}}>
          <Col md={1}></Col>
          <Col>
        <StyledImageSlider>
          {slice.items.map((item, i) => (
            <ImageSlider.Item key={i}>
              <a href={item.link.url} target="_blank">
                <picture>
            <source media="(min-width: 1200px)" srcSet={item.image.thumbnails.laptop.url}></source>
            <source media="(min-width: 1024px)" srcSet={item.image.thumbnails.tablet_landscape.url}></source>
            <source media="(min-width: 768px)" srcSet={item.image.thumbnails.tablet.url}></source>
            <source media="(min-width: 576px)" srcSet={item.image.thumbnails.phone_landscape.url}></source>
                <img
                    className="d-block w-100 lazyload"
                  src={item.image.url}
                  alt={item.alt}
                  width={item.image.dimensions.width}
                />
                </picture>
              </a>
              <ImageSlider.Caption>
                <RichText render={item.caption_title.raw} />
                <RichText render={item.caption_text.raw} />
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
                dimensions {
                      width
                    }
                url(imgixParams: {q: 60})
                thumbnails {
                  laptop {
                    dimensions {
                      width
                    }
                    url(imgixParams: {q: 60})
                  }
                  phone_landscape {
                    dimensions {
                      width
                    }
                    url
                  }
                  tablet {
                    dimensions {
                      width
                    }
                    url(imgixParams: {q: 60})
                  }
                  tablet_landscape {
                    dimensions {
                      width
                    }
                    url(imgixParams: {q: 60})
                  }
                }
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
