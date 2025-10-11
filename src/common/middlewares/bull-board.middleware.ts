import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
  constructor(private readonly bullBoard: any) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.baseUrl.startsWith("/api/admin/queues")) {
      // Add any authentication middleware here if needed
      return this.bullBoard.serverAdapter.getRouter()(req, res, next);
    }
    next();
  }
}
