import * as React from 'react'
import { graphql } from 'gatsby'
import OneColSection from '../components/OneColSection'
import { RichText } from 'prismic-reactjs'
import StyledLinkButton from '../styledComponents/StyledLinkButton'

export const Anrisstext = ({ slice }) => {
    console.log('Anrisstext data', slice)

    return (
        <>
            {slice.items.map((anrisstext, i) => {

                return (
                    // <OneColSection content={teaserItem} />
                    <section id={anrisstext.anchor} key={i}>
                        <article>
                            <RichText render={anrisstext.title.raw} />
                            <RichText render={anrisstext.teasertext.raw} />
                        </article>
                        <StyledLinkButton to={anrisstext.link_to_correspondig_text.url} className="btn btn-outline-danger">
                            {anrisstext.button_label}
                        </StyledLinkButton>
                    </section>
                )
            })}
        </>

    )
}

export const query = graphql`
fragment PrismicHomepageDataBodyAnrisstext on PrismicHomepageDataBodyAnrisstext {
slice_type
items {
                anchor
                button_label
                link_to_correspondig_text {
                  uid
                  url
                }
                teasertext {
                  raw
                }
                title {
                  raw
                }
              }
}
`