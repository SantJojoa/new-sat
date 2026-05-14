import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import puppeteer, { type Browser } from 'puppeteer-core';

const g = global as typeof global & {
    __pdfBrowser?: Browser | null;
    __pdfBrowserPromise?: Promise<Browser> | null;
};

@Injectable()
export class AcompanamientoCertificateReport {

    private async getBrowser(): Promise<Browser> {
        if (g.__pdfBrowser) return g.__pdfBrowser;

        if (!g.__pdfBrowserPromise) {
            g.__pdfBrowserPromise = puppeteer.launch({
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
                g.__pdfBrowser = b;
                g.__pdfBrowserPromise = null;
                b.on('disconnected', () => {
                    g.__pdfBrowser = null;
                    g.__pdfBrowserPromise = null;
                });
                return b;
            }).catch(err => {
                g.__pdfBrowserPromise = null;
                throw err;
            });
        }
        return g.__pdfBrowserPromise;
    }

    private escapeHtml(str: string | null | undefined): string {
        if (!str) return '—';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private formatDate(d: any): string {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private findChrome(): string {
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

    async generate(salida: any): Promise<Buffer> {
        const html = this.buildHtml(salida);
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(html, { waitUntil: 'domcontentloaded' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
            });
            return Buffer.from(pdf);
        } finally {
            await page.close();
        }
    }

    private buildHtml(s: any): string {
        const seg = s.seguimiento_acompanamiento;
        const logoBase64 = require('fs').readFileSync(`${process.cwd()}/public/logo-idsn-certificados.png`).toString('base64');

        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; }
    .page { width: 210mm; min-height: 297mm; padding: 15mm; }
    .data-table td { text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="page">
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
      <tr>
        <td rowspan="2" style="width: 25%; border-right: 1px solid #000; text-align: center; vertical-align: middle; padding: 10px;">
          <img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 100px; height: auto;">
        </td>
        <td style="height: 40px; border-bottom: 1px solid #000; text-align: center; font-weight: bold; font-size: 14pt;">
          PROCESO DE ASISTENCIA TÉCNICA
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">
                <small>CÓDIGO:</small> <strong>F-PATSSP01-08</strong>
              </td>
              <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">
                <small>VERSIÓN:</small> <strong>01</strong>
              </td>
              <td style="padding: 5px; text-align: center;">
                <small>FECHA:</small> <strong>25-09-2014</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="data-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt; margin-top: 8mm;">
      <tr>
        <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #cccccc;">
          SEGUIMIENTO DE ACOMPAÑAMIENTO
        </td>
      </tr>

      <!-- DATOS DE LA PROGRAMACIÓN -->
      <tr>
        <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center;">
          DATOS DE LA PROGRAMACIÓN
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">CÓDIGO:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.codigo)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">TEMA / ACTIVIDAD:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.tema)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">SUBTIPO:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.subtipo_salida)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">FECHA INICIO:</td>
        <td colspan="1" style="border: 1px solid #000; padding: 5px;">${this.formatDate(s.fecha_inicio)}</td>
        <td colspan="1" style="border: 1px solid #000; padding: 5px;">FECHA FINAL:</td>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">${this.formatDate(s.fecha_final)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">LUGAR DEL EVENTO:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.lugar_evento?.name)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">ÁREA:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.areas?.name)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">FUNCIONARIO SOLICITANTE:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(s.solicitante?.names)}</td>
      </tr>

      <!-- RESULTADO DEL ACOMPAÑAMIENTO -->
      <tr>
        <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #cccccc;">
          RESULTADO DEL ACOMPAÑAMIENTO
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">¿SE REALIZÓ EL ACOMPAÑAMIENTO?:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${seg?.se_realizo ? 'SÍ' : 'NO'}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">N° DE INSTITUCIONES ACOMPAÑADAS:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${seg?.num_instituciones ?? '—'}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">N° TOTAL DE PERSONAS ACOMPAÑADAS:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px;">${seg?.num_personas ?? '—'}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 5px;">OBSERVACIONES:</td>
        <td colspan="4" style="border: 1px solid #000; padding: 5px; min-height: 40px;">${this.escapeHtml(seg?.observaciones)}</td>
      </tr>
    </table>

    <!-- FIRMAS -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 18mm;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: bottom; padding: 0 10px;">
          <div style="border-top: 1px solid #000; padding-top: 6px; font-size: 9pt; font-weight: bold;">
            FIRMA DEL FUNCIONARIO SOLICITANTE
          </div>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%; text-align: center; vertical-align: bottom; padding: 0 10px;">
          <div style="border-top: 1px solid #000; padding-top: 6px; font-size: 9pt; font-weight: bold;">
            FIRMA DEL RESPONSABLE DEL ÁREA
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
    }
}
