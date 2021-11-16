import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import MainLayoutPart from './MainLayoutPart'
import { linkResolver } from '../utils/linkResolver'

/* import { Link } from 'gatsby'

const CustomLink = (type, element, content, children, index) => {
    console.log('custom Link', element.data)

  if (element.data.link_type === 'Document') {
    <Link to={linkResolver(element.data)} key={element.data.id}>
      {content}
    </Link>
  }

  if (element.data.link_type === 'Web') {
    <a id={element.data.id} href={element.data.url}>
      {content}
    </a>
  }
  return null
} */

export const PageContent = ({ pageContent }) => {

    // const pageContents = (<RichText render={pageContent || []} serializeHyperlink={CustomLink}/>)
    const pageContents = (<RichText render={pageContent || []} linkResolver={linkResolver}/>)
    return (
        <MainLayoutPart content={pageContents} />
    )
}
