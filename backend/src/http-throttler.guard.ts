import { type ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

// Rate limits the HTTP API only. The socket events need a game code (and mostly a player) to do
// anything, so they're left alone.
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(context: ExecutionContext) {
    return context.getType() !== 'http' || super.shouldSkip(context)
  }
}
