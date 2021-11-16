const { defaultLanguage } = require('../../prismic-configuration')

/**
 * The Link Resolver used for the Prismic repository. This function converts a
 * Prismic document to a URL within your app. It is used throughout your app to
 * resolve document links and support editor previews.
 *
 * {@link https://prismic.io/docs/technologies/link-resolver-gatsby}
 *
 * @param doc Prismic document to resolve to a URL within your app.
 *
 * @returns URL for the provided Prismic document.
 */
exports.linkResolver = (doc) => {
  // console.log('linkResolver doc', doc)

  switch (doc.type) {
    case 'homepage': {
      return doc.lang === defaultLanguage ? '/' : `/${doc.lang}`
    }

    case 'page': {
      console.log('page triggerd', doc.uid)
      return doc.lang === defaultLanguage
        // ? `/page/${doc.uid}`
        ? `/${doc.uid}`
        // : `/page/${doc.lang}/${doc.uid}`
        : `/${doc.lang}/${doc.uid}`
    }

    default:
      return '/'
  }
}
