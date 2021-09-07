import * as React from 'react'
import { RichText } from 'prismic-reactjs'

export const PageContent = ({ pageContent }) => {
    return (
        <div>
            <RichText render={pageContent || []} />
        </div>
    )
}
