import * as React from 'react'
import { Row, Col } from 'react-bootstrap'
import { RichText } from 'prismic-reactjs'
import { linkResolver } from '../utils/linkResolver'
import linkStyles from './styled/linkStyles'
import styled from 'styled-components'

const StyledRow = styled(Row)`

    a {
        ${linkStyles}
    }
`

export const OneColSection = ({ content }) => {
    return (
        <StyledRow className="mt-4 mt-md-5 mb-4 mb-md-5">
            <Col md={1} lg={2}></Col>
            <Col>
                <RichText render={content} linkResolver={linkResolver}/>
            </Col>
            <Col md={1} lg={2}></Col>
        </StyledRow>
    )
}
