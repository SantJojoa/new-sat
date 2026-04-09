import { Injectable } from '@nestjs/common';
import { ArticulacionesExcelReport } from '../../articulaciones/reports/articulaciones-excel.report';

@Injectable()
export class IvcExcelReport extends ArticulacionesExcelReport {}
