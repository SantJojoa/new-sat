import { Injectable } from '@nestjs/common';
import { PuppeteerBrowserService } from '../../common/services/puppeteer-browser.service';

@Injectable()
export class AcompanamientoCertificateReport {
    constructor(private readonly puppeteerBrowser: PuppeteerBrowserService) { }

    async generate(salida: any): Promise<Buffer> {
        const html = this.buildHtml(salida);
        const browser = await this.puppeteerBrowser.getBrowser();
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
        const fechaReunion = acta.fecha_reunion ? this.puppeteerBrowser.formatDate(acta.fecha_reunion) : s.fecha;
        const proximaFecha = acta.proxima_fecha ? this.puppeteerBrowser.formatDate(acta.proxima_fecha) : s.proxima_reunion?.fecha;
        const logoBase64 = this.puppeteerBrowser.getLogoBase64();

    const asistentesRows = asArray(acta.asistentes ?? s.asistentes).map((a: any) => `
<tr>
    <td colspan="4" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml([a.nombre, a.apellido].filter(Boolean).join(' '))}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(a.identificacion)}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(a.cargo)}
    </td>
    <td colspan="2" style="border:1px solid #000; padding:18px 5px;"></td>
</tr>
`).join('');


    const ordenDiaRows = asArray(acta.orden_del_dia ?? s.orden_del_dia ?? s.orden_dia).map((o: any) => `
<tr>
    <td colspan="6" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(o.tematica)}
    </td>
    <td colspan="4" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(o.responsable)}
    </td>
</tr>
`).join('');

        const conclusionesRow = `
<tr>
    <td colspan="10"
        style="border:1px solid #000; padding:8px; height:80px; vertical-align:top;">
        ${this.puppeteerBrowser.escapeHtml(acta.conclusiones ?? s.conclusiones)}
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
        ${this.puppeteerBrowser.escapeHtml(c.compromiso)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        RESPONSABLE:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(c.responsable)}
    </td>

    <td colspan="2" style="border:1px solid #000; padding:5px;">
        FECHA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(c.fecha)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        OBSERVACIÓN:
    </td>

    <td colspan="8" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(c.observacion)}
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
        ${this.puppeteerBrowser.escapeHtml(acta.proxima_lugar ?? s.proxima_reunion?.lugar)}
    </td>
</tr>

<tr>
    <td colspan="2" style="border:1px solid #000; padding:5px;">
        FECHA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(proximaFecha)}
    </td>

    <td colspan="2" style="border:1px solid #000; padding:5px;">
        HORA:
    </td>

    <td colspan="3" style="border:1px solid #000; padding:5px;">
        ${this.puppeteerBrowser.escapeHtml(acta.proxima_hora ?? s.proxima_reunion?.hora_inicio)}
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
    ${this.puppeteerBrowser.escapeHtml(acta.nombre_reunion ?? s.nombre_reunion)}
  </td>
</tr>

<tr>
  <td style="border: 1px solid #000; padding: 5px;">LUGAR:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(acta.lugar ?? s.lugar)}</td>

  <td style="border: 1px solid #000; padding: 5px;">FECHA:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(fechaReunion)}</td>

  <td style="border: 1px solid #000; padding: 5px;">Hora inicial:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(acta.hora_inicial ?? s.hora_inicio)}</td>

  <td style="border: 1px solid #000; padding: 5px;">HORA FINAL:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(acta.hora_final ?? s.hora_final)}</td>

  <td style="border: 1px solid #000; padding: 5px;">Acta No.:</td>
  <td style="border: 1px solid #000; padding: 5px;">${this.puppeteerBrowser.escapeHtml(acta.acta_numero ?? s.acta)}</td>
</tr>
    

    <tr>
        <td colspan="1" style="border:1px solid #000; padding:5px;">
            MUNICIPIO:
        </td>

        <td colspan="2" style="border:1px solid #000; padding:5px;">
            ${this.puppeteerBrowser.escapeHtml(acta.municipio ?? s.municipio)}
        </td>

        <td colspan="1" style="border:1px solid #000; padding:5px;">
            INSTITUCIÓN:
        </td>

        <td colspan="3" style="border:1px solid #000; padding:5px;">
            ${this.puppeteerBrowser.escapeHtml(acta.institucion ?? s.institucion)}
        </td>
         <td colspan="2" style="border:1px solid #000; padding:5px;">
            MATERIAL ENTREGADO:
        </td>

        <td colspan="1" style="border:1px solid #000; padding:5px;">
            ${this.puppeteerBrowser.escapeHtml(acta.material_entregado ?? s.material_entregado)}
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
            ${this.puppeteerBrowser.escapeHtml(acta.desarrollo ?? s.desarrollo)}
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
            ${this.puppeteerBrowser.escapeHtml(acta.conclusiones ?? s.conclusiones)}
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
            ${this.puppeteerBrowser.escapeHtml(s.seguimiento)}
        </td>
    </tr>

</table>

  </div>
</body>
</html>`;
    }
}
