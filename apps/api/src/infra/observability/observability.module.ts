import { Global, Module } from '@nestjs/common'

import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'
import { ObservabilityService } from './observability.service'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [ObservabilityService, MetricsService, HttpMetricsInterceptor],
  exports: [ObservabilityService, MetricsService, HttpMetricsInterceptor]
})
export class ObservabilityModule {}
