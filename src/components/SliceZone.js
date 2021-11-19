import * as React from 'react'

import {
/*   EmailSignup,
  FullWidthImage,
  HeadlineWithButton,
  InfoWithImage,
  TextInfo, */
  Hero,
  Preisliste,
  CallToActionGrid,
  Anrisstext,
  Carousel,
  HtmlContent,
  ImageAndText,
  TextBlock,
  Accordion
} from '../slices'

export const SliceZone = ({ slices }) => {
  const sliceComponents = {
    // Key = slice type from api
/*     headline_with_button: HeadlineWithButton,
    email_signup: EmailSignup,
    full_width_image: FullWidthImage,
    info_with_image: InfoWithImage,
    text_info: TextInfo, */
    hero: Hero,
    preisliste: Preisliste,
    call_to_action_grid: CallToActionGrid,
    anrisstext: Anrisstext,
    carousel: Carousel,
    html_inhalte: HtmlContent,
    bild_und_text: ImageAndText,
    text_block: TextBlock,
    akkordeon: Accordion
  }

  return slices.map((slice, index) => {
    const SliceComponent = sliceComponents[slice.slice_type]

    if (SliceComponent) {
      return <SliceComponent slice={slice} key={`slice-${index}`} />
    }

    return null
  })
}
