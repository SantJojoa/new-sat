import { Injectable } from '@nestjs/common';
import { ArticulacionesPdfReport } from '../../articulaciones/reports/articulaciones-pdf.report';

@Injectable()
export class IvcPdfReport extends ArticulacionesPdfReport {}
