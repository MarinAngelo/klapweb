import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import { heroQuery } from './heroQuery'
import PageCover from './styledHero'

export const Hero = ({ slice }) => {
    console.log('Hero data', slice)
    // const mainImg = slice.primary.background_image.localFile.childImageSharp.gatsbyImageData
    const thumbImgs = slice.primary.background_image.thumbnails
    console.log('thumbImgs', thumbImgs)

    const defaultTheme = {
      bgColor: "black"
    }

    return (
        <PageCover 
          className="d-flex position-relative" 
          role="img" aria-label={slice.primary.background_image.alt}
          mobileImg={slice.primary.background_image.localFile ? slice.primary.background_image.localFile.childImageSharp.gatsbyImageData : null}
          mobileLsImg={thumbImgs.mobile_ls.localFile ? thumbImgs.mobile_ls.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
          desktopImg={thumbImgs.desktop.localFile ? thumbImgs.desktop.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
          tabletImg={thumbImgs.tablet.localFile ? thumbImgs.tablet.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
          bgColor={slice.primary.bg_color ? slice.primary.bg_color : defaultTheme.bgColor}
          // bgColor={slice.primary.bg_color ? slice.primary.bg_color : defaultTheme.pageColor}
        >
            <div className="cover-text-box">
                <div className="cover-text">
                    <RichText render={slice.primary.hero_title.raw || []} />
                    <RichText render={slice.primary.hero_content.raw || []} />
                </div>
            </div>
        </PageCover>
    )
}
