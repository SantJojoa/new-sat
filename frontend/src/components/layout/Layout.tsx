import { Outlet } from 'react-router-dom'
import Navbar from '../ui/Navbar'
import Footer from '../ui/Footer'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light">
            <Navbar />
            <main className="grow">
                <Outlet /> {/* Aquí se renderizan las páginas */}
            </main>
            <Footer />
        </div>
    )
}