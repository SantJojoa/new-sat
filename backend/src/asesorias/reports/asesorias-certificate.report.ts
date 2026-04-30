import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import puppeteer from 'puppeteer-core';

@Injectable()
export class AsesoriasCertificateReport {

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

  async generate(asesoria: any): Promise<Buffer> {
    const html = this.buildHtml(asesoria);
    const browser = await puppeteer.launch({
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
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  // ─── Variables disponibles en el template ────────────────────────────────
  // a.codigo              → string   Ej: "ASE-20240101-SAL01"
  // a.fecha               → string   Fecha ISO → usar this.formatDate(a.fecha)
  // a.hora                → string   Ej: "09:00"
  // a.medio               → string   Ej: "Presencial"
  // a.lugar               → string
  // a.duracion_minutos    → number
  // a.estado              → string   Ej: "registrada"
  // a.institucion         → string
  // a.municipio_procedencia?.name → string | undefined
  // a.municipio_otro      → string | undefined
  // a.temas_tratados      → string
  // a.material_entregado  → string
  // a.areas?.name         → string
  // a.registrador?.names  → string
  // a.registrador?.email  → string
  // a.asistentes          → Array<{ identificacion, nombre, apellido, cargo?, email?, movil? }>
  // a.compromisos         → Array<{ compromiso, responsable, fecha?, observaciones? }>
  //
  // Helpers disponibles:
  //   this.escapeHtml(valor)   → escapa caracteres HTML
  //   this.formatDate(fecha)   → devuelve "dd/mm/yyyy"
  // ─────────────────────────────────────────────────────────────────────────

  getHtml(a: any): string {
    return this.buildHtml(a);
  }

  private buildHtml(a: any): string {
    const municipio = this.escapeHtml(a.municipio_procedencia?.name ?? a.municipio_otro);
    const registradorDependencia = this.escapeHtml(a.registrador?.areas?.name ?? a.areas?.name);

    const asistentesRows = (a.asistentes ?? []).map((ast: any, i: number) => `
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #e0e0e0;">
                ASISTENTE ${i + 1}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">NOMBRES Y APELLIDOS:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(ast.nombre)} ${this.escapeHtml(ast.apellido)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">IDENTIFICACIÓN:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(ast.identificacion)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">CARGO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(ast.cargo)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">TELÉFONO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(ast.movil)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">EMAIL:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(ast.email)}</td>
        </tr>`).join('');

    const compromisosRows = (a.compromisos ?? []).map((c: any, i: number) => `
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #e0e0e0;">
                COMPROMISO ${i + 1}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">COMPROMISO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(c.compromiso)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">RESPONSABLE:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(c.responsable)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">FECHA:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.formatDate(c.fecha)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">OBSERVACIÓN:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(c.observaciones)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    /* ═══════════════════════════════════════════
       ESTILOS DEL CERTIFICADO — edita aquí
       Tamaño de página A4: 210mm x 297mm
    ═══════════════════════════════════════════ */
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
    }
    .data-table td {
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">

        <!-- FILA PRINCIPAL -->
        <tr>
            <!-- LOGO -->
            <td rowspan="2"
                style="width: 25%; border-right: 1px solid #000; text-align: center; vertical-align: middle; padding: 10px;">
                <span style="color: #999;">
                    <img src="../../../public/logo-idsn-certificados.png" alt="Logo"
                        style="width: 100px; height: auto;">
                </span>
            </td>

            <!-- ESPACIO DERECHO SUPERIOR -->
            <td
                style="height: 40px; border-bottom: 1px solid #000; text-align: center; font-weight: bold; font-size: 14pt;">
                PROCESO DE ASISTENCIA TÉCNICA
                <!-- aquí puedes poner título si quieres -->
            </td>
        </tr>

        <!-- FILA DE DATOS -->
        <tr>
            <td style="padding: 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">
                            <small>CÓDIGO:</small> <strong>F-PATSSP01-07</strong>
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

        <!-- TITULO -->
        <tr>
            <td colspan="6"
                style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #cccccc;">
                ASESORÍA INDIVIDUAL
            </td>
        </tr>

        <!-- FUNCIONARIO IDSN -->
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center;">
                FUNCIONARIO DEL IDSN QUE BRINDA LA ASESORÍA
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">NOMBRES Y APELLIDOS:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.registrador?.names + ' ' + a.registrador?.last_name)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">CARGO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.registrador?.charge)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">DEPENDENCIA:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${registradorDependencia}</td>
        </tr>

        <!-- ASISTENTES -->
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center;">
                DATOS DE QUIEN RECIBE LA ASESORÍA
            </td>
        </tr>
        ${asistentesRows}

        <!-- DATOS GENERALES DE LA ASESORÍA -->
        <tr>
            <td colspan="6" style="height: 8px; border: none;"></td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">LUGAR:</td>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.lugar)}</td>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">FECHA:</td>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">${this.formatDate(a.fecha)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MEDIO:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.medio)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">TEMA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.temas_tratados)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MATERIAL ENTREGADO:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.material_entregado)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MUNICIPIO PROCEDENCIA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${municipio}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">INSTITUCIÓN:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(a.institucion)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">DURACIÓN:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.escapeHtml(String(a.duracion_minutos ?? '—'))} minutos</td>
        </tr>

        <!-- COMPROMISOS -->
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #cccccc;">
                COMPROMISOS
            </td>
        </tr>
        ${compromisosRows}

    </table>
    </div>
  </div>
</body>
</html>`;
  }
}
