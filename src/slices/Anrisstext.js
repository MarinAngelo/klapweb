import * as React from 'react'
import { graphql } from 'gatsby'
import { RichText } from 'prismic-reactjs'
import StyledLinkButton from '../styledComponents/StyledLinkButton'
import MainLayoutPart from '../components/MainLayoutPart'
import { linkResolver } from '../utils/linkResolver'

export const Anrisstext = ({ slice }) => {
    // console.log('Anrisstext data', slice)

    return (
        <>
            {slice.items.map((anrisstext, i) => {

                const anrisstextContent = (
                    <section id={anrisstext.anchor} key={i}>
                        <article>
                            <RichText render={anrisstext.title.raw} />
                            <RichText render={anrisstext.teasertext.raw} linkResolver={linkResolver}/>
                        </article>
                        <StyledLinkButton to={anrisstext.link_to_correspondig_text.url} className="btn btn-outline-success">
                            {anrisstext.button_label}
                        </StyledLinkButton>
                    </section>
                )
                return (
                    <MainLayoutPart content={anrisstextContent} key={i} />
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
