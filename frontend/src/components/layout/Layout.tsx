import { Outlet } from 'react-router-dom'
import WhatsNewModal from '../common/WhatsNewModal'
import AvisosPopup from '../common/AvisosPopup'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light">
            <main className="grow">
                <Outlet />
            </main>
            <WhatsNewModal />
            <AvisosPopup />
        </div>
    )
}
