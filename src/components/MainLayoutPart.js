import * as React from 'react'
import { Row, Col } from 'react-bootstrap'

const MainLayoutPart = ({content}) => {
    return (
        <Row className="mt-4 mt-md-5 mb-4 mb-md-5">
            <Col md={1} lg={2}></Col>
            <Col>
            {content}
            </Col>
            <Col md={1} lg={2}></Col>
        </Row>
    )
}

export default MainLayoutPart
