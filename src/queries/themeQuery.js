import { graphql } from 'gatsby'

const themeQuery = graphql`
fragment ThemeFragment on PrismicTheme {
         data {
fonts {
          font_usage
          google_font
        }
        footer_bg_color
        footer_color
        header_bg_color
        header_color
        page_bg_color
        page_color
        page_link_color
      }
    }
`

export { themeQuery }