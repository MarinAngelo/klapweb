import * as React from 'react'
import Akkordeon from 'react-bootstrap/Accordion'
import { Row, Col } from 'react-bootstrap'
import { graphql } from 'gatsby'
import styled from 'styled-components'
import { AccordionItem } from './AccordionItem'
import SectionTitle from '../../components/SectionTitle'

export const Accordion = ({ slice }) => {
  // console.log('Accordion data', slice)

  return (
    <>
      <SectionTitle title={slice.primary.accordion_title.raw} />
      <Row className="mt-4 mt-md-5 mb-4 mb-md-5">
        <Col md={1} lg={2}></Col>
        <Col>
          <StyledAkkordeon flush>
            {slice.items.map((item, i) => {
              console.log('key', i)
              return (
                <AccordionItem title={item.accordion_item_title.raw} text={item.accordion_item_text.raw} i={i} />
              )
            })}
          </StyledAkkordeon>
        </Col>
        <Col md={1} lg={2}></Col>
      </Row>
    </>
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
const StyledAkkordeon = styled(Akkordeon)`

  .accordion-body {
    background-color: #C7C8FF;
  }

  button {
    background-color: #C7C8FF;

  }

  .accordion-button:not(.collapsed) {
    background-color: #C7C8FF;
    color: var(--page-coor);
    box-shadow: none;
  }

  .accordion-button.collapsed {
    color: var(--page-coor);
    &:focus {
      box-shadow: none;
    }
  }

  .accordion-button h3 {
    font-size: 1.2rem;
  }

  p {

    font-size: 1rem;
  }
`