import React from 'react'
import { Info } from 'lucide-react';


export default function Navbar() {
    return (
        <header className='bg-white flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light 
       px-6 py-3 backdrop-blur-md sticky top-0 z-50'>
            <div className='flex items-center gap-4 text-primary'>
                <div className='size-8'>
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="icon icon-tabler icons-tabler-filled icon-tabler-folder">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
                    </svg>
                </div>
                <h2 className='text-text-primary text-lg font-bold leading-tight tracking-[-0.015em]'>
                    SAT-IDSN
                </h2>
            </div>

            <button
                className="flex items-center justify-center rounded-lg h-10 bg-primary/10 text-primary px-3 transition-colors cursor-pointer hover:text-green-800 hover:bg-green-800/10"
                aria-label="Ayuda"
            >
                <Info />
            </button>
        </header>
    )
}