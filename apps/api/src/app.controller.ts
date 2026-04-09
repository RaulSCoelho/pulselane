import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class AppController {
  @Get()
  @Version('1')
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  getHealth() {
    return { status: 'ok' };
  }
}
