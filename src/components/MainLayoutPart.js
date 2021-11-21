import * as React from 'react'
import { Row, Col } from 'react-bootstrap'
import styled from 'styled-components'
import linkStyles from './styled/linkStyles'

const StyledRow = styled(Row)`
    a {
    ${linkStyles}
  }
`

const MainLayoutPart = ({ content, usedInComponent}) => {

    if (usedInComponent = "footer") {

        return (
            <StyledRow className="mt-4 mt-md-5 mb-4 mb-md-5">
                <Col md={1} lg={2}></Col>
                <Col>
                {content}
                </Col>
                <Col md={1} lg={2}></Col>
            </StyledRow>
        )
    } else {
        return (
            <Row className="mt-4 mt-md-5 mb-4 mb-md-5"  >
                <Col md={1} lg={2}></Col>
                <Col>
                    {content}
                </Col>
                <Col md={1} lg={2}></Col>
            </Row>
        )
    }
    
}

export default MainLayoutPart
