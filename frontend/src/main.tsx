import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Navbar from './componets/ui/Navbar'
import Login from './componets/pages/Login'
import Footer from './componets/ui/Footer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Navbar />
    <Login />
    <Footer />
  </StrictMode>,
)
