import * as React from 'react'
import { RichText } from 'prismic-reactjs'

export const PageTitle = ({ pageTitle }) => {
    return (
        <div>
            <RichText render={pageTitle || []} />
        </div>
    )
}
