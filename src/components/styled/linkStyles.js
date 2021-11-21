import { css } from "styled-components";

const linkStyles = css`
    text-decoration: none;
    font-style: italic;
    color: var(--page-link-color);

    &:hover {
      color: var(--page-link-color-darker);
      text-decoration: underline;
    }
`

export default linkStyles