import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { TenantPrismaService } from './tenant-prisma.service';

interface PooledConnection {
  prisma: TenantPrismaService;
  lastUsed: Date;
  inUse: boolean;
  datasourceUrl: string;
}

@Injectable()
export class TenantPrismaPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaPoolService.name);
  private readonly connectionPool = new Map<string, PooledConnection>();
  private readonly maxIdleTime = 5 * 60 * 1000; // 5 minutes
  private readonly cleanupInterval = 60 * 1000; // 1 minute
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.cleanupInterval);
  }

  async getConnection(datasourceUrl: string): Promise<TenantPrismaService> {
    const poolKey = this.getPoolKey(datasourceUrl);
    
    let connection = this.connectionPool.get(poolKey);
    
    if (!connection) {
      // Create new connection
      this.logger.debug(`Creating new connection for: ${poolKey}`);
      const prisma = new TenantPrismaService(datasourceUrl);
      await prisma.$connect();
      
      connection = {
        prisma,
        lastUsed: new Date(),
        inUse: true,
        datasourceUrl,
      };
      
      this.connectionPool.set(poolKey, connection);
    } else {
      // Reuse existing connection
      connection.lastUsed = new Date();
      connection.inUse = true;
    }
    
    return connection.prisma;
  }

  releaseConnection(datasourceUrl: string): void {
    const poolKey = this.getPoolKey(datasourceUrl);
    const connection = this.connectionPool.get(poolKey);
    
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = new Date();
    }
  }

  private getPoolKey(datasourceUrl: string): string {
    // Create a unique key from the datasource URL
    return Buffer.from(datasourceUrl).toString('base64');
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    const connectionsToCleanup: string[] = [];

    for (const [key, connection] of this.connectionPool.entries()) {
      const idleTime = now.getTime() - connection.lastUsed.getTime();
      
      if (!connection.inUse && idleTime > this.maxIdleTime) {
        connectionsToCleanup.push(key);
      }
    }

    for (const key of connectionsToCleanup) {
      const connection = this.connectionPool.get(key);
      if (connection) {
        try {
          await connection.prisma.$disconnect();
          this.connectionPool.delete(key);
          this.logger.debug(`Cleaned up idle connection: ${key}`);
        } catch (error) {
          this.logger.error(`Error cleaning up connection ${key}:`, error);
        }
      }
    }

    if (connectionsToCleanup.length > 0) {
      this.logger.debug(`Cleaned up ${connectionsToCleanup.length} idle connections`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Disconnect all connections
    const disconnectPromises: Promise<void>[] = [];
    
    for (const [key, connection] of this.connectionPool.entries()) {
      disconnectPromises.push(
        connection.prisma.$disconnect().catch(error => {
          this.logger.error(`Error disconnecting connection ${key}:`, error);
        })
      );
    }

    await Promise.all(disconnectPromises);
    this.connectionPool.clear();
    this.logger.log('All database connections closed');
  }

  // Debug method to get pool status
  getPoolStatus(): { totalConnections: number; activeConnections: number; idleConnections: number } {
    let activeConnections = 0;
    let idleConnections = 0;

    for (const connection of this.connectionPool.values()) {
      if (connection.inUse) {
        activeConnections++;
      } else {
        idleConnections++;
      }
    }

    return {
      totalConnections: this.connectionPool.size,
      activeConnections,
      idleConnections,
    };
  }
}
