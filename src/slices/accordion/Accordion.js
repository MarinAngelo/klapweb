import * as React from 'react'
import Akkordeon from 'react-bootstrap/Accordion'
import { Row, Col } from 'react-bootstrap'
import { graphql } from 'gatsby'
import styled, {css} from 'styled-components'
import { AccordionItem } from './AccordionItem'
import SectionTitle from '../../components/SectionTitle'
import linkStyles from '../../components/styled/linkStyles'

export const Accordion = ({ slice }) => {
  // console.log('Accordion data', slice)

  return (
    <>
      <SectionTitle title={slice.primary.accordion_title.raw} />
      <Row className="mt-4 mt-md-5 mb-4 mb-md-5">
        <Col md={1} lg={2}></Col>
        <Col>
          <StyledAkkordeon defaultActiveKey={0} flush>
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
    background-color: var(--page-bg-color-darker);
  }

  a {
    ${linkStyles}
  }

  button {
    background-color: var(--page-color-darker);

    &:hover {
      background-color: var(--page-color-dark);
    }

  }

  .accordion-button:not(.collapsed) {
    background-color: var(--page-color-dark);
    color: var(--page-color);
    box-shadow: none;
  }

  .accordion-button.collapsed {
    color: var(--page-color);
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