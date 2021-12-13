const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

const prismicConfig = require('./prismic-configuration')

module.exports = {
  siteMetadata: {
    language: 'de',
    title: 'Klap Web | Design & Programmierung, Websites neu konzipiert.',
    description: 'Neuste Web-Technologie: Schlankes Frontend mit einem auf Deine Bedürfnisse zugeschnittenem und übersichtlichem Content Management System (CMS).',
    siteUrl: `https://www.klap-web.ch`,
  },
  plugins: [
    {
      resolve: "gatsby-plugin-anchor-links",
      options: {
        offset: -100
      }
    },
    {
      resolve: `gatsby-plugin-styled-components`,
      options: {
        // Add any options here
      },
    },
    {
      resolve: 'gatsby-source-prismic',
      options: {
        repositoryName: prismicConfig.prismicRepo,
        accessToken: process.env.PRISMIC_ACCESS_TOKEN,
        schemas: {
          homepage: require('./custom_types/homepage.json'),
          page: require('./custom_types/page.json'),
          top_menu: require('./custom_types/top_menu.json'),
          website_daten: require('./custom_types/website_daten.json'),
          layout: require('./custom_types/layout.json'),
          landing_page: require('./custom_types/landing_page.json'),
        },
        linkResolver: require('./src/utils/linkResolver').linkResolver,
      },
    },
    {
      resolve: 'gatsby-plugin-prismic-previews',
      options: {
        repositoryName: prismicConfig.prismicRepo,
        accessToken: process.env.PRISMIC_ACCESS_TOKEN,
      },
    },
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [
          `limelight`,
          `source sans pro\:300,400,400i,700`, // you can also specify font weights and styles,
          'Indie Flower',
          'Rubik Beastly',
          'Codystar\:400'
        ],
        display: 'swap'
      }
    },
    'gatsby-plugin-image',
    'gatsby-plugin-react-helmet',
    'gatsby-transformer-sharp',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: path.resolve(__dirname, 'src', 'images'),
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Klap Web',
        short_name: 'Klap Web',
        start_url: '/',
        background_color: '#232442',
        theme_color: '#232442',
        display: 'minimal-ui',
        icon: path.resolve(__dirname, 'src', 'images', 'favicon.png'),
      },
    },
  ],
}
