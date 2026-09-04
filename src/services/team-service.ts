import type { TeamStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { AuthorizationContext } from "@/domain/access";
import { requireCapability } from "@/lib/auth/context";
import { NotFoundError } from "@/domain/errors";
import { TeamRepository, UserRepository } from "@/repositories/tenant-repositories";
import { recordEvent } from "@/services/events";

export class TeamService {
  list(context: AuthorizationContext) { requireCapability(context, "teams.read"); return new TeamRepository(db).list(context.tenantId); }
  async create(context: AuthorizationContext, input: { name: string; description?: string }) {
    requireCapability(context, "teams.create");
    return db.$transaction(async (transaction) => {
      const team = await transaction.team.create({ data: { ...input, tenantId: context.tenantId } });
      await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "TEAM_CREATED", entityType: "Team", entityId: team.id });
      return team;
    });
  }
  async update(context: AuthorizationContext, teamId: string, input: { name?: string; description?: string; status?: TeamStatus }) {
    requireCapability(context, input.status === "ARCHIVED" ? "teams.archive" : "teams.update");
    if (!await new TeamRepository(db).find(context.tenantId, teamId)) throw new NotFoundError();
    return db.$transaction(async (transaction) => {
      const team = await transaction.team.update({ where: { id_tenantId: { id: teamId, tenantId: context.tenantId } }, data: input });
      await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: input.status === "ARCHIVED" ? "TEAM_ARCHIVED" : "TEAM_UPDATED", entityType: "Team", entityId: teamId });
      return team;
    });
  }
  async addMember(context: AuthorizationContext, teamId: string, userId: string) {
    requireCapability(context, "teams.manage_members");
    const [team, user] = await Promise.all([new TeamRepository(db).find(context.tenantId, teamId), new UserRepository(db).find(context.tenantId, userId)]);
    if (!team || !user) throw new NotFoundError();
    return db.$transaction(async (transaction) => {
      const member = await transaction.teamMember.create({ data: { tenantId: context.tenantId, teamId, userId } });
      await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "TEAM_MEMBER_ADDED", entityType: "Team", entityId: teamId, metadata: { userId } });
      return member;
    });
  }
  async removeMember(context: AuthorizationContext, teamId: string, userId: string) {
    requireCapability(context, "teams.manage_members");
    const membership = await db.teamMember.findFirst({ where: { tenantId: context.tenantId, teamId, userId } });
    if (!membership) throw new NotFoundError();
    await db.$transaction(async (transaction) => {
      await transaction.teamMember.delete({ where: { id: membership.id } });
      await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "TEAM_MEMBER_REMOVED", entityType: "Team", entityId: teamId, metadata: { userId } });
    });
  }
}
