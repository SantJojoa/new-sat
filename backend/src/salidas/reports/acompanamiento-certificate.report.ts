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
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
                    <div style="width:100%; font-family:Arial, Helvetica, sans-serif; font-size:8pt; text-align:center; color:#000;">
                        <span class="pageNumber"></span>/<span class="totalPages"></span>
                    </div>
                `,
                margin: { top: '10mm', right: '12mm', bottom: '15mm', left: '12mm' },
            });
            return Buffer.from(pdf);
        } finally {
            await page.close();
        }
    }

    private buildHtml(s: any): string {
        const seg = s.seguimiento_acompanamiento;
        const acta = seg ?? {};
        const asArray = (value: any): any[] => Array.isArray(value) ? value : [];
        const fechaReunion = acta.fecha_reunion ? this.formatDate(acta.fecha_reunion) : s.fecha;
        const proximaFecha = acta.proxima_fecha ? this.formatDate(acta.proxima_fecha) : s.proxima_reunion?.fecha;
        const logoBase64 = require('fs').readFileSync(`${process.cwd()}/public/logo-idsn-certificados.png`).toString('base64');

    const asistentesRows = asArray(acta.asistentes ?? s.asistentes).map((a: any) => `
<tr>
    <td colspan="4" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml([a.nombre, a.apellido].filter(Boolean).join(' '))}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(a.identificacion)}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(a.cargo)}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:18px 5px;"></td>
</tr>
`).join('');


    const ordenDiaRows = asArray(acta.orden_del_dia ?? s.orden_del_dia ?? s.orden_dia).map((o: any) => `
<tr>
    <td colspan="6" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(o.tematica)}
    </td>
    <td colspan="4" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(o.responsable)}
    </td>
</tr>
`).join('');

        const conclusionesRow = `
<tr>
    <td colspan="10"
        style="border:1px solid #000; padding:8px; height:80px; vertical-align:top;">
        ${this.escapeHtml(acta.conclusiones ?? s.conclusiones)}
    </td>
</tr>
`;

        const compromisos = asArray(acta.compromisos ?? s.compromisos);
        const compromisosRows = compromisos.length ? compromisos.map((c: any, i: number) => `
<tr>
    <td colspan="10"
        style="border:1px solid #000; font-weight:bold; padding:5px; background:#e0e0e0; text-align:center;">
        COMPROMISO ${i + 1}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        COMPROMISO:
    </td>

    <td colspan="8" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(c.compromiso)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        RESPONSABLE:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(c.responsable)}
    </td>

    <td colspan="2" style="border:1px solid #000; padding:5px;">
        FECHA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(c.fecha)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        OBSERVACIÓN:
    </td>

    <td colspan="8" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(c.observacion)}
    </td>
</tr>
`).join('') : `
<tr>
    <td colspan="10" style="border:1px solid #000; padding:12px 5px; height:28px;"></td>
</tr>
`;

        const proximaReunionRow = `
<tr>
    <td colspan="3" style="border:1px solid #000; padding:5px;">
        LUGAR:
    </td>

    <td colspan="7" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(acta.proxima_lugar ?? s.proxima_reunion?.lugar)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        FECHA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(proximaFecha)}
    </td>

    <td colspan="2" style="border:1px solid #000; padding:5px;">
        HORA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.escapeHtml(acta.proxima_hora ?? s.proxima_reunion?.hora_inicio)}
    </td>
</tr>
`;

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
          ACTA DE REUNIÓN
        </td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">
                <small>CÓDIGO:</small> <strong>F-PGED05-11</strong>
              </td>
              <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">
                <small>VERSIÓN:</small> <strong>01</strong>
              </td>
              <td style="padding: 5px; text-align: center;">
                <small>FECHA:</small> <strong>23-08-2013: 01</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="data-table"
       style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt; margin-top: 8mm;">

    <!-- DATOS GENERALES -->
<tr>
  <td 
    colspan="2"
    style="
      border: 1px solid #000;
      padding: 15px;
      white-space: nowrap;
      text-align: left;
      vertical-align: middle;
    "
  >
    Nombre de la Reunion:
  </td>

  <td 
    colspan="8"
    style="
      border: 1px solid #000;
      padding: 5px;
      text-align: left;
    "
  >
    ${this.escapeHtml(acta.nombre_reunion ?? s.nombre_reunion)}
  </td>
</tr>

<tr>
  <td style="border: 1px solid #000; padding: 5px;">LUGAR:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(acta.lugar ?? s.lugar)}</td>

  <td style="border: 1px solid #000; padding: 5px;">FECHA:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(fechaReunion)}</td>

  <td style="border: 1px solid #000; padding: 5px;">Hora inicial:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(acta.hora_inicial ?? s.hora_inicio)}</td>

  <td style="border: 1px solid #000; padding: 5px;">HORA FINAL:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(acta.hora_final ?? s.hora_final)}</td>

  <td style="border: 1px solid #000; padding: 5px;">Acta No.:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(acta.acta_numero ?? s.acta)}</td>
</tr>
    

    <tr>
        <td colspan="1" style="border:1px solid #000; padding:5px;">
            MUNICIPIO:
        </td>

        <td colspan="2" style="border:1px solid #000; padding:5px;">
            ${this.escapeHtml(acta.municipio ?? s.municipio)}
        </td>

        <td colspan="1" style="border:1px solid #000; padding:5px;">
            INSTITUCIÓN:
        </td>

        <td colspan="3" style="border:1px solid #000; padding:5px;">
            ${this.escapeHtml(acta.institucion ?? s.institucion)}
        </td>
         <td colspan="2" style="border:1px solid #000; padding:5px;">
            MATERIAL ENTREGADO:
        </td>

        <td colspan="1" style="border:1px solid #000; padding:5px;">
            ${this.escapeHtml(acta.material_entregado ?? s.material_entregado)}
        </td>
    </tr>

    <!-- ASISTENTES -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            ASISTENTES
        </td>
    </tr>

    <tr>
        <td colspan="4" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            NOMBRE
        </td>
        <td colspan="2" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            IDENTIFICACIÓN
        </td>
        <td colspan="2" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            CARGO
        </td>
        <td colspan="2" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            FIRMA
        </td>
    </tr>

    ${asistentesRows}

    <!-- ORDEN DEL DIA -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            ORDEN DEL DÍA
        </td>
    </tr>

    <tr>
        <td colspan="6" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            TEMÁTICA
        </td>
        <td colspan="4" style="border:1px solid #000; font-weight:bold; padding:5px; text-align:center; background:#e0e0e0;">
            RESPONSABLE
        </td>
    </tr>

    ${ordenDiaRows}

    <!-- DESARROLLO -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            DESARROLLO
        </td>
    </tr>

    <tr>
        <td colspan="10"
            style="border:1px solid #000; padding:10px; min-height:120px; vertical-align:top;">
            ${this.escapeHtml(acta.desarrollo ?? s.desarrollo)}
        </td>
    </tr>

    <!-- CONCLUSIONES -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            CONCLUSIONES
        </td>
    </tr>

    <tr>
        <td colspan="10"
            style="border:1px solid #000; padding:10px; min-height:80px; vertical-align:top;">
            ${this.escapeHtml(acta.conclusiones ?? s.conclusiones)}
        </td>
    </tr>

    <tr>
        <td colspan="10" style="border:0; height:8px; padding:0; background:#fff; line-height:8px;"></td>
    </tr>

    <!-- COMPROMISOS -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            COMPROMISOS Y/O TAREAS
        </td>
    </tr>

    ${compromisosRows}

    <!-- PRÓXIMA REUNIÓN -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            PRÓXIMA REUNIÓN
        </td>
    </tr>

    ${proximaReunionRow}

    <tr>
        <td colspan="10" style="border:0; height:8px; padding:0; background:#fff; line-height:8px;"></td>
    </tr>

    <!-- SEGUIMIENTO -->
    <tr>
        <td colspan="10"
            style="border:1px solid #000; font-weight:bold; padding:6px; text-align:center; background:#cccccc;">
            SEGUIMIENTO
        </td>
    </tr>

    <tr>
        <td colspan="10"
            style="border:1px solid #000; padding:10px; min-height:100px; vertical-align:top;">
            ${this.escapeHtml(s.seguimiento)}
        </td>
    </tr>

</table>

  </div>
</body>
</html>`;
    }
}
