import * as React from 'react'
import { navigate } from 'gatsby'
import styled from 'styled-components'

const LangSwitcher = styled.div`
// Extra small devices (portrait phones, less than 576px)
// No media query for xs since this is the default in Bootstrap
select {
  border: 0;
  background-color: transparent;
}
// Small devices (landscape phones, 576px and up, col-sm)
@media (min-width: 576px) {

}
// Medium devices (tablets, 768px and up, col-md)
@media (min-width: 768px) {

}
// Large devices (desktops, 992px and up, col-lg)
@media (min-width: 992px) {
  margin-left: 5rem;
}
// Extra large devices (large desktops, 1200px and up, col-xl)
@media (min-width: 1200px) {

}

`

import { linkResolver } from '../utils/linkResolver'

export const LanguageSwitcher = ({ activeDocMeta }) => {
  const currentLang = activeDocMeta.lang
  const currentLangOption = (
    <option value={currentLang}>{currentLang.slice(0, 2).toUpperCase()}</option>
  )

  const alternateLangOptions = activeDocMeta.alternateLanguages.map(
    (altLang, index) => (
      <option value={linkResolver(altLang)} key={`alt-lang-${index}`}>
        {altLang.lang.slice(0, 2).toUpperCase()}
      </option>
    ),
  )

  const handleLangChange = (event) => {
    navigate(event.target.value)
  }

  return (
    <LangSwitcher>
      <select value={currentLang} onChange={handleLangChange}>
        {currentLangOption}
        {alternateLangOptions}
      </select>
    </LangSwitcher>
  )
}
