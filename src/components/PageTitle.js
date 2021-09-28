import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import MainLayoutPart from './MainLayoutPart'

export const PageTitle = ({ pageTitle }) => {

    const pageTitleContent = (<RichText render={pageTitle || []} />)

    return (
        <MainLayoutPart content={pageTitleContent} />
    )
}
