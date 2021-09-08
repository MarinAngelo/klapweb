import * as React from 'react'
import { graphql } from 'gatsby'

export const CallToActionGrid = ({slice}) => {
    console.log('CallToActionGrid data', slice)

    return (
        <div>
            <h>Call to action Grid</h>
        </div>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyCallToActionGrid on PrismicHomepageDataBodyCallToActionGrid {
slice_type
}
`
