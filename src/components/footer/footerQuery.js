import { graphql } from 'gatsby'

const websiteDatenQuery = graphql`
fragment WebsiteDatenFragment on PrismicWebsiteDaten {
         data {
        branding
        street
        zip_code
        place
        email
      }
    }
`

const footerQuery = graphql`
fragment TopMenuFragment on PrismicTopMenu {
  _previewable
  data {
    body {
      ... on PrismicTopMenuDataBody1stLevel {
        primary {
          link_text
          nav_link {
            url
          }
        }
        slice_type
      }
      ... on PrismicTopMenuDataBody2ndLevel {
        slice_type
        primary {
          link_text
        }
        items {
          third_level_link_text
          third_level_link {
            lang
            url
          }
        }
      }
    }
    branding
    logo {
      alt
      url
    }
  }
}
`
export { footerQuery, websiteDatenQuery }