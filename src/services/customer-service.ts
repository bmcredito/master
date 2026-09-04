import type { AuthorizationContext } from "@/domain/access";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { maskCpf } from "@/services/customer-import/normalization";
import { recordEvent } from "@/services/events";

export class CustomerService {
  async list(context: AuthorizationContext, search?: string, page = 1, pageSize = 25) {
    requireCapability(context, "customers.read");
    const where = { tenantId: context.tenantId, ...(search ? { OR: [{ fullName: { contains: search, mode: "insensitive" as const } }, { identifiers: { some: { normalizedValue: { contains: search.replace(/\D/g, "") || search.toLowerCase() } } } }] } : {}) };
    const [items, total] = await Promise.all([
      db.customer.findMany({ where, include: { identifiers: true, facts: true, tagAssignments: { include: { tag: true } }, listMembers: { include: { list: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      db.customer.count({ where }),
    ]);
    return { items: items.map((customer) => ({ ...customer, identifiers: customer.identifiers.map((identifier) => ({ ...identifier, displayValue: identifier.type === "CPF" ? maskCpf(identifier.normalizedValue) : identifier.displayValue ?? identifier.normalizedValue })) })), page, pageSize, total };
  }

  async get(context: AuthorizationContext, customerId: string) {
    requireCapability(context, "customers.read");
    return db.customer.findFirst({ where: { id: customerId, tenantId: context.tenantId }, include: { identifiers: true, facts: true, sources: true, tagAssignments: { include: { tag: true } }, listMembers: { include: { list: true } }, timeline: { orderBy: { occurredAt: "desc" } } } });
  }

  async create(context: AuthorizationContext, input: { fullName: string; identifiers?: Array<{ type: "PHONE" | "CPF" | "EMAIL" | "EXTERNAL_ID"; normalizedValue: string }> }) {
    requireCapability(context, "customers.create");
    return db.$transaction(async (transaction) => {
      const customer = await transaction.customer.create({ data: { tenantId: context.tenantId, displayName: input.fullName, fullName: input.fullName, identifiers: input.identifiers ? { create: input.identifiers.map((identifier) => ({ ...identifier, tenantId: context.tenantId })) } : undefined } });
      await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "CUSTOMER_CREATED", entityType: "Customer", entityId: customer.id });
      return customer;
    });
  }
}
