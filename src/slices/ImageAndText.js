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
  
  margin-top: 12rem;
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

  const phoneLandscape = slice.items[0].picture.thumbnails.phone_landscape.url
  const phone = slice.items[0].picture.thumbnails.phone.url
  const laptop = slice.items[0].picture.thumbnails.laptop.url
  const tablet = slice.items[0].picture.thumbnails.tablet.url

  const phoneWidth = slice.items[0].picture.thumbnails.phone.dimensions.width
  const phoneLandscapeWidth = slice.items[0].picture.thumbnails.phone_landscape.dimensions.width
  const tabletWidth = slice.items[0].picture.thumbnails.tablet.dimensions.width
  const laptopWidth = slice.items[0].picture.thumbnails.laptop.dimensions.width

    return (
        <SpecRow>
            <Col sm={6} className="image-col">
          <picture>
            <source media="(min-width: 992px)" srcSet={laptop}></source>
            <source media="(min-width: 768px)" srcSet={tablet}></source>
            <source media="(min-width: 576px)" srcSet={phoneLandscape}></source>
            <img src={phone} className="d-block w-100"/>
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
                thumbnails {
                  laptop {
                    url
                    dimensions {
                      width
                    }
                  }
                  phone_landscape {
                    url
                    dimensions {
                      width
                      height
                    }
                  }
                  phone {
                    url
                    dimensions {
                      width
                    }
                  }
                  tablet {
                    url
                    dimensions {
                      width
                    }
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
/*   < img
className = "d-block w-100"
src = { phoneLandscape }
srcSet = {`
           ${phoneLandscape} ${phoneLandscapeWidth}w,
           ${phone} ${phoneWidth}w, 
           ${laptop} ${laptopWidth}w, 
           ${tablet} ${tabletWidth}w
           `}
sizes = "(min-width: 1600px) 1200px,
  (min - width: 1400px) 1100px,
    (min - width: 1000px) 900px,
      100vw"                       
        /> */