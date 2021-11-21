import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import { Row, Card, Col } from 'react-bootstrap'
import styled from 'styled-components'
import MainLayoutPart from '../components/MainLayoutPart'
import { linkResolver } from '../utils/linkResolver'
import { Link } from 'gatsby'

/* const CustomLink = (type, element, content, children, index) => {
  if (element.data.link_type === 'Document') {
    <Link to={linkResolver(element.data)} key={element.data.id}>
      {content}
    </Link>
  }

  if (element.data.link_type === 'Web') {
    <a id={element.data.id} href={element.data.url}>
      {content}
    </a>
  }
  return null
} */

export const Preisliste = ({ slice }) => {
  // console.log('Preislisten data', slice)

  const priceListContent = (
    <>
    <Row className="mb-3 mb-lg-5">
      <Col>
    <RichText render={slice.primary.price_section_title.raw} />
      </Col>
    </Row>
      <Row md={1} lg={2} className="g-4">
        {slice.items.map((price, i) => {
          return (
            <Col key={i}>
            <StyledCard annex={price.price_annex}>
              <Card.Body>
                  {price.price_annex ? 
                  <div className="annex">
                    {price.price_annex}
                  </div> : null }
                  {/* <RichText render={price.price_list_title.raw} serializeHyperlink={CustomLink}/> */}
                  <RichText render={price.price_list_title.raw} linkResolver={linkResolver}/>
                <div className="price">
                  <p>
                    CHF {new Intl.NumberFormat('de-CH').format(price.price)}.00 <span className="duration">{price.price_type}</span>
                  </p>
                  {/* CHF {price} <span className="duration"></span> */}
                </div>
                <div className="description">
                    {/* <RichText render={price.price_description.raw} serializeHyperlink={CustomLink}/> */}
                    <RichText render={price.price_description.raw} linkResolver={linkResolver} />
                </div>
              </Card.Body>
            </StyledCard>            
            </Col>
          )
        })}
      </Row>
      </>
  )
  return (
    <MainLayoutPart content={priceListContent} />
  )
}

const StyledCard = styled(Card)`
    // determins breakepoint
    /* min-width: 2rem; */
    margin-bottom: 1.5rem !important;
    background-color: ${p => p.annex === "Am beliebtesten" ? 'var(--secondary-bg-color-light)' : 'var(--component-bg-color)'};

    .card-body li {
      font-size: 1rem;
    }
    
    .price p {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .annex{
        background-color: ${p => p.annex === "Am beliebtesten" ? 'var(--component-bg-color)' : 'var(--page-button-hover-bg-color)'};
        position: absolute;
        right: 0;
        top: 0;
        padding: 10px 15px;
        color: var(--page-color);
        font-weight: bold;
        border: 1px solid;
    }
`

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
