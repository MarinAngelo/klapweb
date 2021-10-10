import * as React from 'react'
import { graphql } from 'gatsby'

export const TextBlock = ({ slice }) => { 
    console.log('TextBlock data', slice)    
    
    return (
    <div>
        <h1>TextBlock</h1>
    </div>
    )
 }
 
 export const query = graphql`
 fragment PrismicPageDataBodyTextBlock on PrismicPageDataBodyTextBlock
 {slice_type}
 `