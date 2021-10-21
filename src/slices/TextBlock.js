import * as React from 'react'
import { graphql } from 'gatsby'
import { OneColSection } from '../components/OneColSection'

export const TextBlock = ({ slice }) => { 
    console.log('TextBlock data', slice)    
    
    return (
    <>
        <OneColSection content={slice.primary.text_block.raw} />
    </>
    )
 }
 
 export const query = graphql`
 fragment PrismicPageDataBodyTextBlock on PrismicPageDataBodyTextBlock
 {slice_type
    primary {
              text_block {
                raw
              }
            }
}
 `