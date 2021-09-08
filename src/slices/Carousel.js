import * as React from 'react'
import { graphql } from 'gatsby'

export const Carousel = ({ slice }) => {
    console.log('Carousel data', slice)

    return (
        <div>
            <h>Carousel</h>
        </div>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyCarousel on PrismicHomepageDataBodyCarousel {
slice_type
}
`
