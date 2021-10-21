import * as React from 'react'
import { graphql } from 'gatsby'
import { Row, Col } from 'react-bootstrap'
import styled from 'styled-components'

const SpecRow = styled(Row)`
    margin-top: 11rem;
`

export const ImageAndText = ({ slice }) => {
    console.log('ImageAndText data', slice)

    return (
        <SpecRow>
            <Col style={{marginLeft: "-12px"}}>
                <img src={slice.items[0].picture.thumbnails.laptop.url} width="100%" />
            </Col>
            <Col>
            <p>
                {slice.items[0].text.text}
            </p>
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