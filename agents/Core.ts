/**
 * Core System Orchestrator
 * 
 * This module implements the central orchestration component of the AI system.
 * It manages the Master Control Program (MCP) and provides high-level coordination
 * of all agents in the system.
 */

import { EventEmitter } from 'events';
import { AgentType, AgentMessage, EventType, SystemHealthStatus } from '../shared/agentProtocol';
import { MCP_CONFIG } from '../config/mcpConfig';
import { MasterControlProgram } from './MasterControlProgram';
import { IAgent } from './BaseAgent';
import { MASTER_PROMPT } from '../config/masterPrompt';

/**
 * Core configuration options
 */
export interface CoreConfig {
  systemName: string;
  version: string;
  environment: 'development' | 'production' | 'testing';
  enableLogging: boolean;
}

/**
 * Default configuration for the Core
 */
const DEFAULT_CONFIG: CoreConfig = {
  systemName: 'Benton County Property Valuation System',
  version: '1.0.0',
  environment: 'development',
  enableLogging: true
};

/**
 * Core Orchestrator for the AI System
 */
export class Core extends EventEmitter {
  private static instance: Core;
  private mcp: MasterControlProgram;
  private config: CoreConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private systemStartTime: Date;
  private agents: Map<string, IAgent> = new Map();
  
  /**
   * Private constructor - use Core.getInstance() instead
   * @param config Configuration options
   */
  private constructor(config: Partial<CoreConfig>) {
    super();
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    this.systemStartTime = new Date();
    
    // Create the MCP
    this.mcp = MasterControlProgram.getInstance({
      maxAgents: MCP_CONFIG.maxAgents,
      messageTimeout: MCP_CONFIG.messageTimeout,
      maxRetries: MCP_CONFIG.maxRetries,
      logMessages: MCP_CONFIG.logMessages && this.config.enableLogging,
      throttleRequests: MCP_CONFIG.throttleRequests,
      throttleLimit: MCP_CONFIG.throttleLimit
    });
    
    // Set up health check interval
    this.setupHealthCheck();
    
    // Log initialization
    this.log(`Core initialized successfully`);
  }
  
  /**
   * Get the Core instance (Singleton pattern)
   * @param config Configuration options
   * @returns The Core instance
   */
  public static getInstance(config: Partial<CoreConfig> = {}): Core {
    if (!Core.instance) {
      Core.instance = new Core(config);
    }
    return Core.instance;
  }
  
  /**
   * Register an agent with the system
   * @param agent The agent to register
   */
  public registerAgent(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const agentType = agent.getAgentType();
    
    // Register with MCP
    this.mcp.registerAgent(agent);
    
    // Store in local registry
    this.agents.set(agentId, agent);
    
    // Set up message handler
    agent.setMessageHandler(async (message: AgentMessage) => {
      // Forward message to MCP
      this.mcp.handleMessage(message);
    });
    
    // Emit registration event
    this.emit('agent_registered', {
      agentId,
      agentType
    });
    
    this.log(`Agent registered: ${agentId} (${agentType})`);
  }
  
  /**
   * Get an agent by ID
   * @param agentId The agent ID
   * @returns The agent, or undefined if not found
   */
  public getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents of a specified type
   * @param agentType The type of agents to get
   * @returns Array of agents of that type
   */
  public getAgentsByType(agentType: AgentType): IAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.getAgentType() === agentType);
  }
  
  /**
   * Broadcast an announcement to all agents
   * @param message The message to broadcast
   * @param priority The priority level (high, medium, low)
   */
  public broadcastAnnouncement(message: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const broadcastMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: 'CORE',
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.BROADCAST,
      payload: {
        message,
        priority,
        systemName: this.config.systemName,
        version: this.config.version,
        timestamp: new Date().toISOString()
      }
    };
    
    // Send to MCP for distribution
    this.mcp.handleMessage(broadcastMessage);
  }
  
  /**
   * Set up system health check
   */
  private setupHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, MCP_CONFIG.healthCheckInterval);
  }
  
  /**
   * Perform a system health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Get MCP status
      const mcpStatus = this.mcp.getStatus();
      
      // Get status of all agents
      const agentStatuses = Object.fromEntries(
        Array.from(this.agents.entries()).map(([id, agent]) => 
          [id, agent.getStatus()]
        )
      );
      
      // Determine overall system status
      let systemStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
      const issues: string[] = [];
      
      // Check MCP status
      if (mcpStatus.status !== 'healthy') {
        systemStatus = mcpStatus.status;
        issues.push(`MCP status: ${mcpStatus.status}`);
      }
      
      // Check agent statuses
      for (const [agentId, status] of Object.entries(agentStatuses)) {
        if (status.status !== 'healthy') {
          if (status.status === 'error' && systemStatus !== 'error') {
            systemStatus = 'error';
          } else if (status.status === 'degraded' && systemStatus === 'healthy') {
            systemStatus = 'degraded';
          }
          
          issues.push(`Agent ${agentId} status: ${status.status}`);
        }
      }
      
      // Build health status object
      const healthStatus: SystemHealthStatus = {
        status: systemStatus,
        timestamp: new Date().toISOString(),
        components: {
          mcp: mcpStatus,
          agents: agentStatuses
        },
        issues: issues.length > 0 ? issues : undefined
      };
      
      // Emit health check event
      this.emit('health_check', healthStatus);
      
      this.log(`Health check completed. System status: ${systemStatus}`);
      
      // Alert if system is not healthy
      if (systemStatus !== 'healthy') {
        this.log(`System health issues detected: ${issues.join(', ')}`, 'warn');
      }
    } catch (error) {
      this.log(`Error performing health check: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Add a custom event listener
   * @param event The event name
   * @param listener The event listener function
   */
  public addEventListener(event: string, listener: (...args: any[]) => void): void {
    this.on(event, listener);
  }
  
  /**
   * Get the Master Control Program
   * @returns The MCP instance
   */
  public getMCP(): MasterControlProgram {
    return this.mcp;
  }
  
  /**
   * Get the master prompt
   * @returns The master prompt
   */
  public getMasterPrompt(): string {
    return MASTER_PROMPT;
  }
  
  /**
   * Log a message (if logging is enabled)
   * @param message The message to log
   * @param level The log level
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.config.enableLogging) {
      const timestamp = new Date().toISOString();
      const prefix = `[CORE ${timestamp}]`;
      
      switch (level) {
        case 'info':
          console.log(`${prefix} ${message}`);
          break;
        case 'warn':
          console.warn(`${prefix} WARNING: ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ERROR: ${message}`);
          break;
      }
    }
  }
  
  /**
   * Shut down the Core and all components
   */
  public shutdown(): void {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Shutdown MCP
    this.mcp.shutdown();
    
    // Log shutdown
    this.log(`Core shutting down after ${Math.floor((Date.now() - this.systemStartTime.getTime()) / 1000)} seconds of operation`);
    
    // Remove all listeners
    this.removeAllListeners();
  }
}