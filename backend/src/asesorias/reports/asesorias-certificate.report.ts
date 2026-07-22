import { Injectable } from '@nestjs/common';
import { PuppeteerBrowserService } from '../../common/services/puppeteer-browser.service';

@Injectable()
export class AsesoriasCertificateReport {
    constructor(private readonly puppeteerBrowser: PuppeteerBrowserService) { }

    async generate(asesoria: any): Promise<Buffer> {
        const html = this.buildHtml(asesoria);
        const browser = await this.puppeteerBrowser.getBrowser();
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

    // ─── Variables disponibles en el template ────────────────────────────────
    // a.codigo              → string   Ej: "ASE-20240101-SAL01"
    // a.fecha               → string   Fecha ISO → usar this.puppeteerBrowser.formatDate(a.fecha)
    // a.hora                → string   Ej: "09:00"
    // a.hora_fin            → string   Ej: "10:00"
    // a.medio               → string   Ej: "Presencial"
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
    // a.asistentes          → Array<{ identificacion?, nombre, apellido, cargo, email?, movil? }>
    //
    // Helpers disponibles:
    //   this.puppeteerBrowser.escapeHtml(valor)   → escapa caracteres HTML
    //   this.puppeteerBrowser.formatDate(fecha)   → devuelve "dd/mm/yyyy"
    // ─────────────────────────────────────────────────────────────────────────

    private buildHtml(a: any): string {
        const municipio = this.puppeteerBrowser.escapeHtml(a.municipio_procedencia?.name ?? a.municipio_otro);
        const registradorDependencia = this.puppeteerBrowser.escapeHtml(a.registrador?.areas?.name ?? a.areas?.name);

        const asistentesRows = (a.asistentes ?? []).map((ast: any, i: number) => `
        <tr>
            <td colspan="6" style="border: 1px solid #000; font-weight: bold; padding: 5px; text-align: center; background-color: #e0e0e0;">
                ASISTENTE ${i + 1}
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">NOMBRES Y APELLIDOS:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(ast.nombre)} ${this.puppeteerBrowser.escapeHtml(ast.apellido)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">IDENTIFICACIÓN:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(ast.identificacion)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">CARGO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(ast.cargo)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">TELÉFONO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(ast.movil)}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">EMAIL:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(ast.email)}</td>
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
                    <img src="data:image/png;base64,${this.puppeteerBrowser.getLogoBase64()}" alt="Logo"
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
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml((a.registrador?.names ?? '') + ' ' + (a.registrador?.last_name ?? ''))}</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 5px;">CARGO:</td>
            <td colspan="4" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.registrador?.charge)}</td>
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
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">FECHA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.formatDate(a.fecha)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MEDIO:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.medio)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">TEMA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.temas_tratados)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MATERIAL ENTREGADO:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.material_entregado)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">MUNICIPIO PROCEDENCIA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${municipio}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">INSTITUCIÓN:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.institucion)}</td>
        </tr>
        <tr>
            <td colspan="1" style="border: 1px solid #000; padding: 5px;">HORA:</td>
            <td colspan="5" style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(a.hora)} - ${this.puppeteerBrowser.escapeHtml(a.hora_fin)} (${this.puppeteerBrowser.escapeHtml(String(a.duracion_minutos ?? '—'))} minutos)</td>
        </tr>

    </table>

    <!-- FIRMAS -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 18mm;">
        <tr>
            <td style="width: 45%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                <div style="border-top: 1px solid #000; padding-top: 6px; font-size: 9pt; font-weight: bold;">
                    FIRMA DE QUIEN BRINDA LA ASESORÍA
                </div>
            </td>
            <td style="width: 10%;"></td>
            <td style="width: 45%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                <div style="border-top: 1px solid #000; padding-top: 6px; font-size: 9pt; font-weight: bold;">
                    FIRMA DE QUIEN RECIBE LA ASESORÍA
                </div>
            </td>
        </tr>
    </table>

    </div>
  </div>
</body>
</html>`;
    }
}
