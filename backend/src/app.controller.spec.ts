import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, ConfigService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns public service health metadata', () => {
      const health = appController.getHealth();

      expect(health.name).toBe('website-dong-ho-nguyen-tri-backend');
      expect(health.status).toBe('ok');
      expect(health).not.toHaveProperty('database');
    });

    it('returns detailed service health metadata for authenticated route', () => {
      const health = appController.getDetailedHealth();

      expect(health.name).toBe('website-dong-ho-nguyen-tri-backend');
      expect(health.status).toBe('ok');
      expect(health.database.mode).toBe('in-memory');
      expect(health.audit.memoryLimit).toBe(2000);
    });
  });
});
