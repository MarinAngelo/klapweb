/* import * as React from 'react'
import { graphql } from 'gatsby'
import { GatsbyImage, StaticImage } from 'gatsby-plugin-image'
import { RichText } from 'prismic-reactjs'

import { GatsbyLink } from '../components/GatsbyLink'

export const InfoWithImage = ({ slice }) => {
  const featuredImage = slice.primary.featured_image
  return (
    <section className="info-with-image">
      <div className="featured-image">
        <GatsbyImage
          image={featuredImage?.thumbnails?.mobile?.gatsbyImageData}
          alt={featuredImage?.alt}
          className="mobile-thumbnail"
        />
        <GatsbyImage
          image={featuredImage?.thumbnails?.tablet?.gatsbyImageData}
          alt={featuredImage?.alt}
          className="tablet-thumbnail"
        />
        <GatsbyImage
          image={featuredImage?.gatsbyImageData}
          alt={featuredImage?.alt}
          className="desktop"
        />
      </div>
      <div className="text-content">
        <StaticImage
          src="../images/top-icon.png"
          alt="Checkbox icon"
          placeholder="none"
        />
        <RichText render={slice.primary.section_title.raw || []} />
        <RichText
          render={slice.primary.text.raw || []}
          serializeHyperlink={GatsbyLink}
        />
      </div>
    </section>
  )
}

export const query = graphql`
  fragment PageDataBodyInfoWithImage on PrismicPageDataBodyInfoWithImage {
    primary {
      featured_image {
        url
        gatsbyImageData
        alt
        thumbnails {
          mobile {
            url
            gatsbyImageData
            alt
          }
          tablet {
            url
            gatsbyImageData
            alt
          }
        }
      }
      section_title {
        html
        raw
        text
      }
      text {
        html
        raw
        text
      }
    }
  }
  fragment HomepageDataBodyInfoWithImage on PrismicHomepageDataBodyInfoWithImage {
    primary {
      featured_image {
        gatsbyImageData
        alt
        thumbnails {
          mobile {
            gatsbyImageData
            alt
          }
          tablet {
            gatsbyImageData
            alt
          }
        }
      }
      section_title {
        html
        raw
        text
      }
      text {
        html
        raw
        text
      }
    }
  }
`
 */