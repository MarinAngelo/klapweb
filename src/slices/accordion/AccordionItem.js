import * as React from 'react'
import Accordion from 'react-bootstrap/Accordion'
import { RichText } from 'prismic-reactjs'
import styled from 'styled-components'

const StyledAccordionItem = styled(Accordion)`
        margin-bottom: -3rem;
        background-color: transparent !important;
`

export const AccordionItem = ({ title, text, i }) => {
    console.log('key on item', i)
    return (
        <StyledAccordionItem>
        <Accordion.Item eventKey={i}>
            <Accordion.Header>
                <RichText render={title} />
            </Accordion.Header>
            <Accordion.Body>
                <RichText render={text} />
            </Accordion.Body>
        </Accordion.Item>
        </StyledAccordionItem>
    )
}