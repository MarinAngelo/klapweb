import styled from 'styled-components'
import { Button } from 'react-bootstrap'

const StyledButton = styled(Button)`

    border-radius: 15px;
    letter-spacing: 2px;

    color: var(--page-link-color);
    border-color: var(--page-link-color);

    &:hover{
        color: var(--header-bg-color);
        background: var(--page-link-hover-color);
        border-color: var(--page-link-color);
        transition-duration: 0.4s;
    }
`;

export default StyledButton;
