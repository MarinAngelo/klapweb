import * as React from 'react'
import { Row, Col } from 'react-bootstrap'
import { RichText } from 'prismic-reactjs'

const SectionTitle = ({title}) => {
    return (
        <Row className="mt-4 mt-md-5 mb-4 mb-md-5">
            <Col md={1} lg={2}></Col>
            <Col>
                <RichText render={title} />
            </Col>
            <Col md={1} lg={2}></Col>
        </Row>
    )
}

export default SectionTitle
