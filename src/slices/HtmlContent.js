import * as React from 'react'
import { graphql } from 'gatsby'
import MainLayoutPart from '../components/MainLayoutPart'

export const HtmlContent = ({ slice }) => {

    console.log('Html Content data', slice)

    const htmlContent = (<div dangerouslySetInnerHTML={{ __html: slice.primary.html_code }} />)

    return (
        <MainLayoutPart content={htmlContent} />
    )
}

export const query = graphql`
fragment PrismicPageDataBodyHtmlInhalte on PrismicPageDataBodyHtmlInhalte {
    slice_type
    primary {
              html_code
            }
}
`