import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import MainLayoutPart from './MainLayoutPart'

export const PageContent = ({ pageContent }) => {

    const pageContents = (<RichText render={pageContent || []} />)
    return (
        <MainLayoutPart content={pageContents} />
    )
}
