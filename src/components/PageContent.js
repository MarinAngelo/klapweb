import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import MainLayoutPart from './MainLayoutPart'
import { linkResolver } from '../utils/linkResolver'

export const PageContent = ({ pageContent }) => {

    const pageContents = (<RichText render={pageContent || []} linkResolver={linkResolver}/>)
    return (
        <MainLayoutPart content={pageContents} />
    )
}
