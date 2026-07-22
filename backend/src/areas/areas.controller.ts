import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { AreasService } from "./areas.service";
import { CreateAreaDto } from "./dto/create-area.dto";
import { UpdateAreaDto } from "./dto/update-area.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@Controller('areas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @RequirePermissions('areas', 'create')
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areasService.create(createAreaDto);
    }

    @Get()
    @RequirePermissions('areas', 'view')
    findAll() {
        return this.areasService.findAll();
    }

    @Get(':id')
    @RequirePermissions('areas', 'view')
    findOne(@Param('id') id: string) {
        return this.areasService.findOne(id);
    }

    @Patch(':id')
    @RequirePermissions('areas', 'edit')
    update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
        return this.areasService.update(id, updateAreaDto);
    }

    @Delete(':id')
    @RequirePermissions('areas', 'delete')
    remove(@Param('id') id: string) {
        return this.areasService.remove(id);
    }
}
