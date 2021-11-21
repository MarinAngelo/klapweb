import { css } from 'styled-components'

const buttonStyles = css`

    color: var(--page-color) !important;
    border-radius: 15px;
    letter-spacing: 2px;
    text-decoration: none !important;
    border: 1px solid;
    border-color: var(--page-color);
    font-style: normal !important;
    display: inline-block;
    padding: 0.4rem 0.8rem;
    font-size: 1rem;

    &:hover, &:active{
        color: var(--page-color) !important;
        background-color: var(--page-button-hover-bg-color) !important;
        background: var(--page-bg-color);
        border-color: var(--page-color);
        transition-duration: 0.4s;
    }

    // same as color to avoid changeing
    &:visited{
    color: var(--page-color) !important;
    }
`
export default buttonStyles