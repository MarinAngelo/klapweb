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
    bgColor: "black",
    textBoxBgColor: "#a9a9da",
    textBoxBgOpacity: 1
  }

  const textBoxBgTranparency = slice.primary.banner_bg_transparency
  const textBoxBgOpacity = textBoxBgTranparency < 100 && textBoxBgTranparency >= 90 ? 0.1
    : textBoxBgTranparency < 90 && textBoxBgTranparency >= 80 ? 0.2
    : textBoxBgTranparency < 80 && textBoxBgTranparency >= 70 ? 0.3
    : textBoxBgTranparency < 70 && textBoxBgTranparency >= 60 ? 0.4
    : textBoxBgTranparency < 60 && textBoxBgTranparency >= 70 ? 0.5
    : textBoxBgTranparency < 50 && textBoxBgTranparency >= 60 ? 0.6
    : textBoxBgTranparency < 40 && textBoxBgTranparency >= 50 ? 0.7
    : textBoxBgTranparency < 30 && textBoxBgTranparency >= 40 ? 0.8
    : textBoxBgTranparency < 20 && textBoxBgTranparency >= 30 ? 0.9
    : textBoxBgTranparency >= 20 ? defaultTheme.textBoxBgOpacity
    : 0

    // console.log('Tex Box BG Opacity', textBoxBgOpacity)

  return (
    <PageCover
      className="d-flex position-relative"
      role="img" aria-label={slice.primary.background_image.alt}
      mobileImg={slice.primary.background_image.localFile ? slice.primary.background_image.localFile.childImageSharp.gatsbyImageData : null}
      mobileLsImg={thumbImgs.mobile_ls.localFile ? thumbImgs.mobile_ls.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
      desktopImg={thumbImgs.desktop.localFile ? thumbImgs.desktop.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
      tabletImg={thumbImgs.tablet.localFile ? thumbImgs.tablet.localFile.childImageSharp.gatsbyImageData.images.fallback.src : null}
      bgColor={slice.primary.bg_color ? slice.primary.bg_color : defaultTheme.bgColor}
      textBoxBgColor={slice.primary.banner_bg_color ? slice.primary.banner_bg_color : defaultTheme.textBoxBgColor}
      textBoxBgOpacity={slice.primary.banner_bg_transparency ? textBoxBgOpacity : defaultTheme.textBoxBgOpacity}
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
