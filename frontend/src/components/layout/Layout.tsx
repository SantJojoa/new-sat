import { Outlet } from 'react-router-dom'
import WhatsNewModal from '../common/WhatsNewModal'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light">
            <main className="grow">
                <Outlet />
            </main>
            <WhatsNewModal />
        </div>
    )
}
