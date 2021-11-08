import * as React from 'react'
import { graphql } from 'gatsby'
import { Row, Col } from 'react-bootstrap'
import styled from 'styled-components'

const SpecRow = styled(Row)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
margin-top: 10rem;

  p {
    padding: 1.6rem 1rem 1.6rem 1rem;
    font-size: 1.2rem;
    color: var(--secondary-color-dark);
  }

.image-col {
padding: 0;
}

.text-col {
  background: var(--secondary-bg-color-dark);
}

  .center-text-box {
      display: flex;
    justify-content: center;
    align-items: center;
  }

  .center-text {
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

  p {
    padding: 0 6rem 0 6rem;
    font-size: 1.6rem;
  }
  
  margin-top: 11rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {
  p {
    font-size: 2.6rem;
  }
  margin-top: 11rem;
}
`

export const ImageAndText = ({ slice }) => {
  console.log('ImageAndText Content', slice)

  const phoneLandscape = slice.items[0].picture.thumbnails.phone_landscape.url
  const phone = slice.items[0].picture.url
  const laptop = slice.items[0].picture.thumbnails.laptop.url
  const tablet = slice.items[0].picture.thumbnails.tablet.url

    return (
        <SpecRow>
            <Col sm={6} className="image-col">
          <picture>
            <source media="(min-width: 992px)" srcSet={laptop}></source>
            <source media="(min-width: 768px)" srcSet={tablet}></source>
            <source media="(min-width: 576px)" srcSet={phoneLandscape}></source>
            <img 
            src={phone} 
            className="d-block w-100"
              width="100%"
              height="100%"
              alt={slice.items[0].picture.alt}
            />
          </picture>
            </Col>
            <Col sm={6} className="text-col center-text-box">
              <div className="center-text">
            <p>
                {slice.items[0].text.text}
            </p>
              </div>
            </Col>
        </SpecRow>
    )
}

export const query = graphql`
 fragment PrismicPageDataBodyBildUndText on PrismicPageDataBodyBildUndText {
     slice_type
 items {
              caption {
                text
                html
                raw
              }
              picture {
                alt
                url(imgixParams: {crop: "top", fit: "crop", h: 600, q:40})
                thumbnails {
                  laptop {
                    url(imgixParams: {q:40})
                  }
                  phone_landscape {
                    url(imgixParams: {q:40})
                  }
                  tablet {
                    url(imgixParams: {crop: "top", fit: "crop", h: 750,q:40})
                  }
                }
              }
              text {
                text
              }
              title {
                raw
              }
            }
        }
 `