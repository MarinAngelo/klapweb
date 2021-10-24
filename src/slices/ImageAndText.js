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
    font-size: 1.4rem;
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
    font-size: 2.8rem;
  }
 
  margin-top: 11rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}

`

export const ImageAndText = ({ slice }) => {
    console.log('ImageAndText data', slice)

    return (
        <SpecRow>
            <Col md={6} className="image-col">
            {/* <Col md={6} style={{marginLeft: "-12px"}}> */}
                <img src={slice.items[0].picture.thumbnails.laptop.url} width="100%" />
            </Col>
            <Col md={6} className="text-col center-text-box">
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