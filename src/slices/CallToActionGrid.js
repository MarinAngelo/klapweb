import * as React from 'react'
import { graphql } from 'gatsby'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import styled from 'styled-components'
import { RichText } from 'prismic-reactjs'
import StyledAnchorLinkButton from '../styledComponents/StyledAnchorLinkButton'
import StyledLinkButton from '../styledComponents/StyledLinkButton'

const StyledCard = styled(Card)`
    // determins breakepoint
    min-width: 24rem;
    margin-bottom: 1.5rem !important;
    background: var(--component-bg-color);
`;

export const CallToActionGrid = ({slice}) => {
    console.log('CallToActionGrid data', slice)

    return (
        <>
            <Row className="justify-content-md-center" xs={1} md={2} lg={12}>
            {slice.items.map((cta, i) => {

                const anchorLinkComponent = (
                    <StyledAnchorLinkButton to={`/#${cta.link_to_anchor}`} className="btn btn-outline-danger">
                        {cta.anchor_link_label}
                    </StyledAnchorLinkButton>
                );
                // Not in use here
                /* const goToPageLink = (
                    <StyledLinkButton to={buttonDestination} className="btn btn-outline-danger">
                        {buttonLabel}
                    </StyledLinkButton>
                ); */

                return (
            <StyledCard key={i}>
                <Card.Body>
                    {cta.featuredImage ? // check if image was delivered and render it conditionally
                        <Card.Img src={cta.featuredImage} alt="featured" className="featured-image-wrapper" />
                        : null}
                    <Card.Title>
                        <RichText render={cta.call_to_action_title.raw} />
                    </Card.Title>
                    <RichText render={cta.content.raw} />
                    {/* {cta.link_to_anchor ? anchorLinkComponent : goToPageLink} */}
                    {anchorLinkComponent}
                </Card.Body>
            </StyledCard>
            )
            })
        }
        </Row>
        </>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyCallToActionGrid on PrismicHomepageDataBodyCallToActionGrid {
slice_type
items {
                anchor_link_label
                link_to_anchor
                call_to_action_title {
                  raw
                }
                content {
                  raw
                }
              }
}
`
