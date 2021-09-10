import * as React from 'react'
import { graphql } from 'gatsby'
import { Card } from "react-bootstrap"
import styled from 'styled-components'

export const Carousel = ({ slice }) => {
    console.log('Carousel data', slice)

    return (
        <div>
            <h1>Carousel</h1>
        </div>
    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyCarousel on PrismicHomepageDataBodyCarousel {
slice_type
}
`
