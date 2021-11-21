import styled from 'styled-components'
import { Link } from 'gatsby'
import buttonStyles from '../components/styled/buttonStyles'

const StyledLinkButton = styled(Link)`

    // Small devices
    ${buttonStyles}

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

export default StyledLinkButton;
