import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserContextService } from './services/user-context.service';
import { PuppeteerBrowserService } from './services/puppeteer-browser.service';

@Module({
    providers: [PrismaService, UserContextService, PuppeteerBrowserService],
    exports: [UserContextService, PuppeteerBrowserService],
})
export class CommonModule { }
