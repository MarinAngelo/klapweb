import * as React from 'react'
import { graphql } from 'gatsby'

export const Anrisstext = ({ slice }) => {
    console.log('Anrisstext data', slice)

    return (
        <div>
            <h>Anrisstext</h>
        </div>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyAnrisstext on PrismicHomepageDataBodyAnrisstext {
slice_type
}
`
