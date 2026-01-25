import { Test, TestingModule } from '@nestjs/testing';
import { SubdireccionesService } from './subdirecciones.service';

describe('SubdireccionesService', () => {
  let service: SubdireccionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubdireccionesService],
    }).compile();

    service = module.get<SubdireccionesService>(SubdireccionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
