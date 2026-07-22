import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import puppeteer, { type Browser } from 'puppeteer-core';

@Injectable()
export class PuppeteerBrowserService implements OnModuleInit {
    private browser: Browser | null = null;
    private browserPromise: Promise<Browser> | null = null;
    private logoBase64: string | null = null;

    async onModuleInit() {
        this.getBrowser().catch(() => { });
    }

    async getBrowser(): Promise<Browser> {
        if (this.browser) return this.browser;

        if (!this.browserPromise) {
            this.browserPromise = puppeteer.launch({
                headless: true,
                executablePath: this.findChrome(),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            }).then(b => {
                this.browser = b;
                this.browserPromise = null;
                b.on('disconnected', () => {
                    this.browser = null;
                    this.browserPromise = null;
                });
                return b;
            }).catch(err => {
                this.browserPromise = null;
                throw err;
            });
        }
        return this.browserPromise;
    }

    escapeHtml(str: string | null | undefined): string {
        if (!str) return '—';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    formatDate(d: any): string {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    findChrome(): string {
        if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
            return process.env.PUPPETEER_EXECUTABLE_PATH;
        }
        if (process.platform === 'win32') {
            const pf86 = process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)';
            const pf = process.env['PROGRAMFILES'] ?? 'C:\\Program Files';
            const local = process.env['LOCALAPPDATA'] ?? '';
            const candidates = [
                `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
                `${pf86}\\Google\\Chrome\\Application\\chrome.exe`,
                `${local}\\Google\\Chrome\\Application\\chrome.exe`,
                `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
                `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`,
                `${local}\\Microsoft\\Edge\\Application\\msedge.exe`,
            ];
            for (const p of candidates) {
                if (p && existsSync(p)) return p;
            }
        }
        const linuxCandidates = [
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
        ];
        for (const p of linuxCandidates) {
            if (existsSync(p)) return p;
        }
        throw new Error('Chrome/Chromium not found. Install Chrome or set PUPPETEER_EXECUTABLE_PATH.');
    }

    getLogoBase64(): string {
        if (this.logoBase64 === null) {
            this.logoBase64 = readFileSync(`${process.cwd()}/public/logo-idsn-certificados.png`).toString('base64');
        }
        return this.logoBase64;
    }
}
