const prisma = require('../config/prisma');

const findAll = (where = {}) =>
  prisma.context.findMany({ where, orderBy: { createdAt: 'desc' } });

const findById = (id) => prisma.context.findUnique({ where: { id } });

const create = (data) => prisma.context.create({ data });

const update = (id, data) =>
  prisma.context.update({ where: { id }, data });

const incrementAccess = (id) =>
  prisma.context.update({ where: { id }, data: { accessCount: { increment: 1 } } });

const markStale = (id) =>
  prisma.context.update({ where: { id }, data: { isStale: true } });

const bulkMarkStale = (ids) =>
  prisma.context.updateMany({ where: { id: { in: ids } }, data: { isStale: true } });

const countByType = () =>
  prisma.context.groupBy({ by: ['type'], _count: { _all: true } });

module.exports = {
  findAll, findById, create, update,
  incrementAccess, markStale, bulkMarkStale, countByType,
};
