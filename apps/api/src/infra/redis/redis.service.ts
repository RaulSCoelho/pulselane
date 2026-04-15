import { EnvConfig } from '@/config/env.config'
import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import IORedis from 'ioredis'

type RedisConnectionState = 'disabled' | 'connecting' | 'ready' | 'error'

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly enabled: boolean
  private readonly required: boolean
  private readonly client: IORedis | null

  private state: RedisConnectionState = 'disabled'
  private lastErrorMessage: string | null = null

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.enabled = this.configService.getOrThrow('redisEnabled', { infer: true })
    this.required = this.configService.getOrThrow('redisRequired', { infer: true })

    if (!this.enabled) {
      this.client = null
      this.state = 'disabled'
      return
    }

    const redisUrl = this.configService.getOrThrow('redisUrl', { infer: true })

    this.client = new IORedis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1
    })

    this.bindEvents()
  }

  async onModuleInit() {
    await this.connectIfNeeded()
  }

  async onApplicationShutdown() {
    if (!this.client) {
      return
    }

    try {
      await this.client.quit()
    } catch {
      this.client.disconnect(false)
    }
  }

  isEnabled() {
    return this.enabled
  }

  isRequired() {
    return this.required
  }

  getState() {
    return this.state
  }

  getLastErrorMessage() {
    return this.lastErrorMessage
  }

  getClientOrThrow() {
    if (!this.enabled || !this.client) {
      throw new Error('Redis client is not enabled')
    }

    return this.client
  }

  async ping(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false
    }

    try {
      await this.connectIfNeeded()

      if (this.client.status !== 'ready') {
        return false
      }

      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      this.state = 'error'
      this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown Redis error'
      return false
    }
  }

  private async connectIfNeeded() {
    if (!this.enabled || !this.client) {
      return
    }

    if (this.client.status === 'ready' || this.client.status === 'connect' || this.client.status === 'connecting') {
      return
    }

    try {
      this.state = 'connecting'
      await this.client.connect()
    } catch (error) {
      this.state = 'error'
      this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown Redis error'
    }
  }

  private bindEvents() {
    if (!this.client) {
      return
    }

    this.client.on('connect', () => {
      this.state = 'connecting'
      this.lastErrorMessage = null
    })

    this.client.on('ready', () => {
      this.state = 'ready'
      this.lastErrorMessage = null
    })

    this.client.on('error', error => {
      this.state = 'error'
      this.lastErrorMessage = error.message
    })

    this.client.on('close', () => {
      if (this.enabled) {
        this.state = 'error'
      }
    })

    this.client.on('end', () => {
      if (this.enabled) {
        this.state = 'error'
      }
    })
  }
}
