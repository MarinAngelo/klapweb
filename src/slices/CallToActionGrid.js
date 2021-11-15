import * as React from 'react'
import { graphql } from 'gatsby'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import styled from 'styled-components'
import { RichText } from 'prismic-reactjs'
import StyledAnchorLinkButton from '../styledComponents/StyledAnchorLinkButton'
import { linkResolver } from '../utils/linkResolver'

const StyledCard = styled(Card)`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
background: var(--component-bg-color);
margin: 0 0 .5rem 0;
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {
}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {
    min-width: 21rem;
    margin: 0 0.3rem .5rem 0.3rem;
}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
    // determins breakepoint
    min-width: 28rem;
    margin: 0 .5rem 1.5rem .5rem;
    border: none !important;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}

`;

export const CallToActionGrid = ({slice}) => {
    console.log('CallToActionGrid data', slice)

    return (
        <>
            <Row className="justify-content-center mt-xl-5 mt-md-4 mt-sm-3 mt-2" sm={2} md={4} lg={6}>
            {slice.items.map((cta, i) => {

                const anchorLinkComponent = (
                    <StyledAnchorLinkButton to={`/#${cta.link_to_anchor}`} className="btn btn-outline-success">
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
                            <RichText render={cta.content.raw} linkResolver={linkResolver} />
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
