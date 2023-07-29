import React from 'react'
import {Link} from 'react-router-dom'
import Logo from "../img/logo.webp"

const Footer = () => {
  return (
    <footer>
      <img src={Logo} alt="" />
      <span>Made with &hearts; and <b>React.js</b>.
      </span>
    </footer>
  )
}

export default Footer