import mongoose from 'mongoose'
import { getTenantContext } from '../middleware/tenantContext.js'

export default function tenantPlugin(schema) {
  if (!schema.path('gym')) {
    schema.add({ gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true, index: true } })
  }
  const scope = function () {
    const ctx = getTenantContext()
    if (!ctx?.gymId || ctx.platformOwner) return
    this.setQuery({ $and: [this.getQuery(), { gym: ctx.gymId }] })
  }
  schema.pre(/^find/, scope)
  schema.pre(/^findOneAndUpdate/, scope)
  schema.pre(/^updateMany/, scope)
  schema.pre(/^updateOne/, scope)
  schema.pre(/^deleteMany/, scope)
  schema.pre(/^deleteOne/, scope)
  schema.pre(/^findOneAndDelete/, scope)
  schema.pre('aggregate', function () {
    const ctx = getTenantContext()
    if (!ctx?.gymId || ctx.platformOwner) return
    this.pipeline().unshift({ $match: { gym: new mongoose.Types.ObjectId(ctx.gymId) } })
  })
  schema.pre('save', function (next) {
    const ctx = getTenantContext()
    if (!ctx?.gymId || ctx.platformOwner) return next()
    if (!this.gym) this.gym = ctx.gymId
    if (String(this.gym) !== String(ctx.gymId)) return next(new Error('Tenant boundary violation.'))
    next()
  })
}
