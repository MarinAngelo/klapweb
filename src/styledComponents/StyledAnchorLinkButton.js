import styled from 'styled-components'
import { AnchorLink } from "gatsby-plugin-anchor-links"

const StyledAnchorLinkButton = styled(AnchorLink)`

    // Small devices
    border-radius: 15px;
    letter-spacing: 2px;
    text-decoration: none !important;
    border: 2px solid;

    color: var(--page-link-color);
    border-color: var(--page-link-color);
    display: inline-block;

    padding: 0.4rem 0.8rem;
    font-size: 1.3rem;

    &:hover{
        color: var(--page-button-hover-color) !important;
        background: var(--page-button-hover-bg-color);
        border-color: var(--page-link-color);
        transition-duration: 0.4s;

    }

    // Small devices (landscape phones, 576px and up)
    @media (min-width: 576px) {
    }

    // Medium devices (tablets, 768px and up)
    @media (min-width: 768px) {
    }

    // Large devices (desktops, 992px and up)
    @media (min-width: 992px) {

    }

    // Extra large devices (large desktops, 1200px and up)
    @media (min-width: 1200px) {
        
    }
`;

export default StyledAnchorLinkButton;
