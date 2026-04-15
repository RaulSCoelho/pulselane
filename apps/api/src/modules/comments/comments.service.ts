import { SuccessResponseDto } from '@/common/dto/success-response.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { MembershipService } from '@/modules/membership/membership.service'
import { TasksService } from '@/modules/tasks/tasks.service'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, MembershipRole, Prisma } from '@prisma/client'

import { CommentRepository } from './comment.repository'
import { CreateCommentDto } from './dto/requests/create-comment.dto'
import { ListCommentActivityHistoryQueryDto } from './dto/requests/list-comment-activity-history-query.dto'
import { ListCommentsQueryDto } from './dto/requests/list-comments-query.dto'
import { UpdateCommentDto } from './dto/requests/update-comment.dto'

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commentRepository: CommentRepository,
    private readonly membershipService: MembershipService,
    private readonly tasksService: TasksService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async create(actorUserId: string, organizationId: string, dto: CreateCommentDto, tx?: Prisma.TransactionClient) {
    const createComment = async (trx: Prisma.TransactionClient) => {
      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      if (actorMembership.role === MembershipRole.viewer) {
        throw new ForbiddenException('You do not have permission to create comments')
      }

      await this.tasksService.findOne(organizationId, dto.taskId, trx)

      return this.commentRepository.create(
        {
          organizationId,
          taskId: dto.taskId,
          authorUserId: actorUserId,
          body: dto.body
        },
        trx
      )
    }

    if (tx) {
      return createComment(tx)
    }

    return this.prisma.$transaction(trx => createComment(trx))
  }

  async findAll(organizationId: string, query: ListCommentsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    await this.tasksService.findOne(organizationId, query.taskId, tx)

    const result = await this.commentRepository.findManyByTask(
      {
        organizationId,
        taskId: query.taskId,
        cursor: query.cursor,
        limit
      },
      tx
    )

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor
      }
    }
  }

  async update(
    actorUserId: string,
    organizationId: string,
    commentId: string,
    dto: UpdateCommentDto,
    tx?: Prisma.TransactionClient
  ) {
    const updateComment = async (trx: Prisma.TransactionClient) => {
      const comment = await this.getCommentOrThrow(commentId, organizationId, trx)

      if (comment.deletedAt) {
        throw new ConflictException('Comment has already been deleted')
      }

      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      if (!this.canManageComment(actorUserId, comment.authorUserId, actorMembership.role)) {
        throw new ForbiddenException('You do not have permission to edit this comment')
      }

      const previousBody = comment.body

      const updatedComment = await this.commentRepository.update(
        comment.id,
        {
          body: dto.body
        },
        trx
      )

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'comment',
          entityId: updatedComment.id,
          action: AuditLogAction.updated,
          metadata: {
            taskId: updatedComment.taskId,
            previousBody,
            body: updatedComment.body
          }
        },
        trx
      )

      return updatedComment
    }

    if (tx) {
      return updateComment(tx)
    }

    return this.prisma.$transaction(trx => updateComment(trx))
  }

  async remove(
    actorUserId: string,
    organizationId: string,
    commentId: string,
    tx?: Prisma.TransactionClient
  ): Promise<SuccessResponseDto> {
    const removeComment = async (trx: Prisma.TransactionClient) => {
      const comment = await this.getCommentOrThrow(commentId, organizationId, trx)

      if (comment.deletedAt) {
        throw new ConflictException('Comment has already been deleted')
      }

      const actorMembership = await this.membershipService.ensureUserIsMember(actorUserId, organizationId, { tx: trx })

      if (!this.canManageComment(actorUserId, comment.authorUserId, actorMembership.role)) {
        throw new ForbiddenException('You do not have permission to delete this comment')
      }

      const deletedComment = await this.commentRepository.softDelete(comment.id, trx)

      await this.auditLogsService.create(
        {
          organizationId,
          actorUserId,
          entityType: 'comment',
          entityId: deletedComment.id,
          action: AuditLogAction.deleted,
          metadata: {
            taskId: deletedComment.taskId,
            body: deletedComment.body,
            deletedAt: deletedComment.deletedAt
          }
        },
        trx
      )

      return {
        success: true
      }
    }

    if (tx) {
      return removeComment(tx)
    }

    return this.prisma.$transaction(trx => removeComment(trx))
  }

  async findActivityHistory(
    organizationId: string,
    query: ListCommentActivityHistoryQueryDto,
    tx?: Prisma.TransactionClient
  ) {
    const limit = query.limit ?? 20

    await this.tasksService.findOne(organizationId, query.taskId, tx)

    const result = await this.commentRepository.findActivityHistoryByTask(
      {
        organizationId,
        taskId: query.taskId,
        cursor: query.cursor,
        limit
      },
      tx
    )

    return {
      items: result.items.map(item => ({
        id: item.id,
        source: item.source,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        taskId: item.taskId,
        content: item.content,
        occurredAt: item.occurredAt,
        deletedAt: item.deletedAt,
        metadata: item.metadata as Record<string, unknown> | null,
        actor:
          item.actorId && item.actorName && item.actorEmail
            ? {
                id: item.actorId,
                name: item.actorName,
                email: item.actorEmail
              }
            : null
      })),
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor
      }
    }
  }

  private async getCommentOrThrow(commentId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const comment = await this.commentRepository.findByIdAndOrganization(commentId, organizationId, tx)

    if (!comment) {
      throw new NotFoundException('Comment not found')
    }

    return comment
  }

  private canManageComment(actorUserId: string, authorUserId: string, role: MembershipRole): boolean {
    if (actorUserId === authorUserId) {
      return true
    }

    return role === MembershipRole.owner || role === MembershipRole.admin
  }
}
