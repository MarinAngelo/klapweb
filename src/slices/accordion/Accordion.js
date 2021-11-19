import * as React from 'react'
import Akkordeon from 'react-bootstrap/Accordion'
import { Row, Col } from 'react-bootstrap'
import { graphql } from 'gatsby'
import styled from 'styled-components'
import { AccordionItem } from './AccordionItem'
import SectionTitle from '../../components/SectionTitle'

const StyledAkkordeon = styled(Akkordeon)`

  .accordion-flush {
    background-color: black !important;
  }

  .accordion-body {
    background-color: #C7C8FF;
  }

  button {
    background-color: #C7C8FF;

  }

  .accordion-button:not(.collapsed) {
    background-color: #C7C8FF;
  }

  h3 {
    font-size: 1.3;
  }
  p {

    font-size: 1rem;
  }
`

export const Accordion = ({ slice }) => {
  // console.log('Accordion data', slice)

  return (
    <Row className="mt-4 mt-md-5 mb-4 mb-md-5">
      <Col md={1} lg={2}></Col>
      <Col>
        <SectionTitle title={slice.primary.accordion_title.raw} />
        <StyledAkkordeon flush>
          {slice.items.map((item, i) => {
            console.log('key', i)
            return (
            <AccordionItem title={item.accordion_item_title.raw} text={item.accordion_item_text.raw} i={i} />
          )})}
        </StyledAkkordeon>
      </Col>
      <Col md={1} lg={2}></Col>
    </Row>
  )
}

export const query = graphql`
   fragment PrismicPageDataBodyAkkordeon on PrismicPageDataBodyAkkordeon {
   slice_type
   primary {
              accordion_title {
                raw
              }
            }
   items {
              accordion_item_text {
                raw
              }
              accordion_item_title {
                raw
              }
            }
}
`