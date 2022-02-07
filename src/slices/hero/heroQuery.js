import { graphql } from 'gatsby'

const heroQuery = graphql`
fragment PrismicHomepageDataBodyHero on PrismicHomepageDataBodyHero {
              slice_type
          primary {
            banner_bg_color
            bg_color
            hero_content {
              html
              raw
              text
            }
            hero_title {
              text
              html
              raw
            }
            background_image {
                alt
                              localFile {
                  childImageSharp {
                    gatsbyImageData(quality: 60)
                  }
                }
                thumbnails {
                  desktop {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                  mobile_ls {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                  tablet {
                    localFile {
                      childImageSharp {
                        gatsbyImageData(quality: 60)
                      }
                    }
                  }
                }
            }
          }
        }`

export { heroQuery }