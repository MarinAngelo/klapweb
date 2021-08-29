import * as React from 'react'
import { graphql } from 'gatsby'

export const Hero = ({ slice }) => {
    return (
        <div>
            <h1>I'm a Hero</h1>
        </div>
    )
}

export const query = graphql`
  fragment PrismicHomepageDataBodyHero on PrismicHomepageDataBodyHero {
              slice_type
          primary {
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
              url
            }
          }
        }`