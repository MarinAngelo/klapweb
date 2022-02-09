import styled from 'styled-components'
import { hexToRgbA } from '../../utils/ColorAdjust';

const rgba = hexToRgbA("#a9a9da", 0.5);
// console.log('RGBA', rgba)

const PageCover = styled.section`
  // Extra small devices (portrait phones, less than 576px)
  // No media query for xs since this is the default in Bootstrap
/*   background-image: linear-gradient(to bottom, rgba(35,36,66, 0.9), rgba(94,95,170, 0.3)),
                    url(${props => props.mobileImg}); */
  /* background-color: ${props => props.bgColor};
  background: linear-gradient( to bottom, ${props => props.bgColor}, rgba(94,95,170, 0.3)) !important; */
background: linear-gradient(0deg, rgba(128,201,155,1) 17%, rgba(144,122,214,1) 100%) !important;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  margin: 0 -12px 0 -12px;
  height: 101vh !important;

  .cover-text-box{
    width: 100%;
    color: var(--header-color);
    /* center the inner div */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .cover-text{
    text-align: center;
    margin-left: 2rem;
    margin-right: 2rem;
    /* font-family: 'Mochiy Pop P One'; */
    font-family: 'Michroma';
    /* font-family: 'Gotu'; */
  }

  .cover-text h2 {
    font-size: 1.3rem;
    margin-top: 2rem;
  }

  // Small devices (landscape phones, 576px and up, col-sm)
  @media (min-width: 576px) {
    background-image: url(${props => props.mobileLsImg});
    
    .cover-text h1{
      font-size: 1.3rem;
    }
    
    .cover-text h2{
      font-size: 1.2rem;
      margin-top: 0;
      padding-top: 1rem;
    }
    
    .cover-text {
      width:90%;
    }
  }
  // Medium devices (tablets, 768px and up, col-md)
  @media (min-width: 768px) {
    background-image: url(${props => props.tabletImg});

    /* .cover-text-box{
      min-width: 40vw;
      position: absolute;
      top: 25vh;
      left: 10vw;
    } */
    
    .cover-text h1{
      font-size: 2.3rem;
    }
    
    .cover-text h2{
      font-size: 1.6rem;
    }
  }
  // Large devices (desktops, 992px and up, col-lg)
  @media (min-width: 992px) {
    background-image: url(${props => props.desktopImg});
    height: calc(100vh - 55px); // minus hight of navbar

    /* .cover-text-box{
      min-width: 40vw;
      position: absolute;
      top: 25vh;
      left: 10vw;
    } */

        .cover-text h1{
      font-size: 2.3rem;
    }

    .cover-text h2{
      font-size: 1.6rem;
    }

    .cover-text{
      width:85%;
    }
  }
  
  // Extra large devices (large desktops, 1200px and up, col-xl)
  @media (min-width: 1200px) {
  
  }
  `
export default PageCover;