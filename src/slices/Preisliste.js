import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import { Row, Card, Col } from 'react-bootstrap'
import styled from 'styled-components'
import MainLayoutPart from '../components/MainLayoutPart'

const StyledCard = styled(Card)`
    // determins breakepoint
    min-width: 24rem;
    margin-bottom: 1.5rem !important;
    background-color: ${p => p.annex === "Am beliebtesten" ? 'orange' : 'var(--component-bg-color)'};

    .annex{
        background-color: ${p => p.annex === "Am beliebtesten" ? 'var(--component-bg-color)' : 'orange'};
        position: absolute;
        right: 0;
        top: 0;
        padding: 10px 15px;
        color: var(--page-color);
        font-weight: bold;
    }
`

export const Preisliste = ({ slice }) => {
  // console.log('Preislisten data', slice)

  const priceListContent = (
    <>
    <Row className="mb-3 mb-lg-5">
      <Col>
    <RichText render={slice.primary.price_section_title.raw} />
      </Col>
    </Row>
      <Row className="justify-content-md-center" xs={1} md={2}>
        {slice.items.map((price, i) => {
          return (
            <StyledCard annex={price.price_annex}>
              <Card.Body>
                  <div className="annex">
                    {price.price_annex}
                  </div>
                <RichText render={price.price_list_title.raw} />
                <div className="price">
                  <p>
                    CHF {new Intl.NumberFormat('de-CH').format(price.price)}.00 <span className="duration">{price.price_type}</span>
                  </p>
                  {/* CHF {price} <span className="duration"></span> */}
                </div>
                <div className="description">
                  <RichText render={price.price_description.raw} />
                </div>
              </Card.Body>
            </StyledCard>            
          )
        })}
      </Row>
      </>
  )
  return (
    <MainLayoutPart content={priceListContent} />
  )
}

export const query = graphql`
  fragment PrismicPageDataBodyPreisliste on PrismicPageDataBodyPreisliste {
    slice_type
    items {
                price
                price_annex
                price_description {
                  raw
                }
                price_list_title {
                  raw
                }
                price_type
              }
              primary {
                price_section_title {
                  raw
                }
              }
  }
  `
