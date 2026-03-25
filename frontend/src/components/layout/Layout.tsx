import { Outlet } from 'react-router-dom'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background-light">
            <main className="grow">
                <Outlet />
            </main>
        </div>
    )
}
