import { Test, TestingModule } from '@nestjs/testing';
import { SubdireccionesController } from './subdirecciones.controller';

describe('SubdireccionesController', () => {
  let controller: SubdireccionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubdireccionesController],
    }).compile();

    controller = module.get<SubdireccionesController>(SubdireccionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
