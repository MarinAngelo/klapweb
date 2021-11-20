import * as React from 'react'
import Accordion from 'react-bootstrap/Accordion'
import { RichText } from 'prismic-reactjs'

export const AccordionItem = ({ title, text, i }) => {
    // console.log('key on item', i)
    return (
        <Accordion.Item eventKey={i}>
            <Accordion.Header>
                <RichText render={title} />
            </Accordion.Header>
            <Accordion.Body>
                <RichText render={text} />
            </Accordion.Body>
        </Accordion.Item>
    )
}