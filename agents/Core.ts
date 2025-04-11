/**
 * Core - Master Hub for System Orchestration
 * 
 * The Core serves as the central orchestrator managing configurations, 
 * system-wide directives, shared resources, and integration of responses
 * from various agents.
 */

import { MasterControlProgram } from './MasterControlProgram';
import { getEnvironmentConfig } from '../config/mcpConfig';
import { MASTER_PROMPT, getPersonalizedMasterPrompt } from '../config/masterPrompt';
import { AgentMessage, EventType, AgentType } from '../shared/agentProtocol';
import { IAgent } from './BaseAgent';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for the Core
 */
export interface CoreConfig {
  systemName: string;
  version: string;
  environment: 'development' | 'test' | 'production';
  enableLogging: boolean;
}

/**
 * System health status
 */
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  components: {
    mcp: {
      status: 'healthy' | 'degraded' | 'error';
      message?: string;
    };
    agents: Record<string, {
      status: 'healthy' | 'degraded' | 'error';
      lastUpdate: string;
      message?: string;
    }>;
  };
  metrics: {
    totalAgents: number;
    activeAgents: number;
    replayBufferSize: number;
    messagesProcessed: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

/**
 * Core class implementing the master hub functionality
 */
export class Core {
  private static instance: Core;
  
  private config: CoreConfig;
  private mcp: MasterControlProgram;
  private systemStatus: SystemHealthStatus;
  private messageCount: number = 0;
  private startTime: Date;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();
  
  /**
   * Create a new Core instance
   * @param config Configuration for the Core
   */
  private constructor(config: CoreConfig) {
    this.config = config;
    this.startTime = new Date();
    
    // Initialize MCP
    const mcpConfig = getEnvironmentConfig();
    this.mcp = new MasterControlProgram(mcpConfig);
    
    // Add core as MCP message listener
    this.mcp.addMessageListener(this.handleMessage.bind(this));
    
    // Initialize system status
    this.systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        mcp: {
          status: 'healthy'
        },
        agents: {}
      },
      metrics: {
        totalAgents: 0,
        activeAgents: 0,
        replayBufferSize: 0,
        messagesProcessed: 0,
        errorRate: 0,
        avgResponseTime: 0
      }
    };
    
    // Schedule periodic health checks
    setInterval(() => this.performHealthCheck(), 60000); // Every minute
    
    this.log('Core initialized successfully');
  }
  
  /**
   * Get the Core instance (singleton)
   * @param config Configuration for the Core if not already initialized
   * @returns The Core instance
   */
  public static getInstance(config?: CoreConfig): Core {
    if (!Core.instance) {
      if (!config) {
        throw new Error('Core must be initialized with a configuration');
      }
      Core.instance = new Core(config);
    }
    return Core.instance;
  }
  
  /**
   * Get the Master Control Program instance
   * @returns The MCP instance
   */
  public getMcp(): MasterControlProgram {
    return this.mcp;
  }
  
  /**
   * Register an agent with the system
   * @param agent The agent to register
   */
  public registerAgent(agent: IAgent): void {
    // Register agent with MCP
    this.mcp.registerAgent(agent);
    
    // Send master prompt to the agent
    const personalizedPrompt = getPersonalizedMasterPrompt(
      agent.getAgentType().toString(),
      agent.getAgentId()
    );
    
    this.mcp.sendMessageToAgent(
      agent.getAgentId(),
      EventType.COMMAND,
      {
        commandName: 'initialize_with_master_prompt',
        parameters: {
          masterPrompt: personalizedPrompt
        }
      }
    );
    
    // Update system status
    this.systemStatus.components.agents[agent.getAgentId()] = {
      status: 'healthy',
      lastUpdate: new Date().toISOString()
    };
    
    this.systemStatus.metrics.totalAgents++;
    this.systemStatus.metrics.activeAgents++;
    
    this.log(`Agent registered: ${agent.getAgentId()} (${agent.getAgentType()})`);
    
    // Emit agent registered event
    this.emitEvent('agent_registered', {
      agentId: agent.getAgentId(),
      agentType: agent.getAgentType()
    });
  }
  
  /**
   * Unregister an agent from the system
   * @param agentId ID of the agent to unregister
   */
  public unregisterAgent(agentId: string): void {
    // Unregister agent from MCP
    this.mcp.unregisterAgent(agentId);
    
    // Update system status
    if (this.systemStatus.components.agents[agentId]) {
      delete this.systemStatus.components.agents[agentId];
      this.systemStatus.metrics.totalAgents--;
      this.systemStatus.metrics.activeAgents--;
    }
    
    this.log(`Agent unregistered: ${agentId}`);
    
    // Emit agent unregistered event
    this.emitEvent('agent_unregistered', {
      agentId
    });
  }
  
  /**
   * Get the current system health status
   * @returns System health status
   */
  public getSystemStatus(): SystemHealthStatus {
    // Update metrics before returning
    this.systemStatus.metrics.replayBufferSize = this.mcp.getReplayBufferSize();
    this.systemStatus.metrics.messagesProcessed = this.messageCount;
    this.systemStatus.metrics.errorRate = this.errorCount / Math.max(1, this.messageCount);
    
    if (this.responseTimes.length > 0) {
      this.systemStatus.metrics.avgResponseTime = 
        this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    }
    
    this.systemStatus.timestamp = new Date().toISOString();
    
    return { ...this.systemStatus };
  }
  
  /**
   * Broadcast a system-wide announcement to all agents
   * @param message The announcement message
   * @param priority Message priority
   */
  public broadcastAnnouncement(message: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    this.mcp.broadcastMessage(
      EventType.EVENT,
      {
        event: 'system_announcement',
        message,
        timestamp: new Date().toISOString()
      },
      {
        metadata: {
          priority
        }
      }
    );
    
    this.log(`System announcement broadcast: ${message}`);
    
    // Emit announcement event
    this.emitEvent('system_announcement', {
      message,
      priority
    });
  }
  
  /**
   * Update the master prompt and distribute to all agents
   * @param updatedPrompt New master prompt content
   */
  public updateMasterPrompt(updatedPrompt: string): void {
    // In a real implementation, this would update the master prompt in the configuration
    // For this example, we just broadcast the updated prompt
    
    this.mcp.broadcastMessage(
      EventType.COMMAND,
      {
        commandName: 'update_master_prompt',
        parameters: {
          masterPrompt: updatedPrompt
        }
      }
    );
    
    this.log('Master prompt updated and distributed to all agents');
    
    // Emit master prompt updated event
    this.emitEvent('master_prompt_updated', {
      newPrompt: updatedPrompt
    });
  }
  
  /**
   * Trigger system-wide training for all agents
   */
  public triggerSystemTraining(): void {
    this.mcp.triggerTraining();
    
    this.log('System-wide training triggered');
    
    // Emit training triggered event
    this.emitEvent('system_training_triggered', {
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Add an event listener for Core events
   * @param eventType Type of event to listen for
   * @param callback Callback function to call when event occurs
   */
  public addEventListener(eventType: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)?.push(callback);
  }
  
  /**
   * Remove an event listener
   * @param eventType Type of event
   * @param callback Callback function to remove
   */
  public removeEventListener(eventType: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }
  
  /**
   * Handle a message from the MCP
   * @param message The message to handle
   */
  private handleMessage(message: AgentMessage): void {
    this.messageCount++;
    
    // Track response times for RESPONSE messages
    if (message.eventType === EventType.RESPONSE && message.metadata?.processingTime) {
      this.responseTimes.push(message.metadata.processingTime);
      
      // Keep response times array from growing too large
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift();
      }
    }
    
    // Track errors
    if (message.eventType === EventType.ERROR) {
      this.errorCount++;
      
      // Update agent status if this is an agent error
      if (message.sourceAgentId !== 'MCP' && message.sourceAgentId !== 'Core') {
        if (this.systemStatus.components.agents[message.sourceAgentId]) {
          this.systemStatus.components.agents[message.sourceAgentId].status = 'degraded';
          this.systemStatus.components.agents[message.sourceAgentId].lastUpdate = new Date().toISOString();
          this.systemStatus.components.agents[message.sourceAgentId].message = message.payload.errorMessage;
        }
      }
      
      // Log error
      this.log(`Error from ${message.sourceAgentId}: ${message.payload.errorMessage}`, 'error');
    }
    
    // Emit message event
    this.emitEvent('message', message);
    
    // Emit specific event for message type
    this.emitEvent(`message_${message.eventType.toLowerCase()}`, message);
  }
  
  /**
   * Perform a system-wide health check
   */
  private performHealthCheck(): void {
    // Check MCP health
    const mcpHealth = {
      status: 'healthy' as 'healthy' | 'degraded' | 'error',
      message: 'MCP operating normally'
    };
    
    // Get agent metrics from MCP
    const agentMetrics = this.mcp.getAgentMetrics();
    
    // Update agent statuses
    let activeAgents = 0;
    
    Object.entries(agentMetrics).forEach(([agentId, metrics]) => {
      const status = metrics.healthStatus === 'healthy' ? 'healthy' : 'degraded';
      
      this.systemStatus.components.agents[agentId] = {
        status,
        lastUpdate: metrics.lastUpdated.toISOString()
      };
      
      if (status === 'healthy') {
        activeAgents++;
      }
    });
    
    // Update system status
    this.systemStatus.components.mcp = mcpHealth;
    this.systemStatus.metrics.activeAgents = activeAgents;
    
    // Determine overall system status
    if (mcpHealth.status === 'error') {
      this.systemStatus.status = 'error';
    } else if (mcpHealth.status === 'degraded' || activeAgents < this.systemStatus.metrics.totalAgents) {
      this.systemStatus.status = 'degraded';
    } else {
      this.systemStatus.status = 'healthy';
    }
    
    this.log(`Health check completed. System status: ${this.systemStatus.status}`);
    
    // Emit health check event
    this.emitEvent('health_check', this.getSystemStatus());
  }
  
  /**
   * Emit an event to all registered listeners
   * @param eventType Type of event
   * @param data Event data
   */
  private emitEvent(eventType: string, data: any): void {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    const listeners = this.eventListeners.get(eventType) || [];
    
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        this.log(`Error in event listener for ${eventType}: ${(error as Error).message}`, 'error');
      }
    });
  }
  
  /**
   * Log a message to the console
   * @param message Message to log
   * @param level Log level
   */
  private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.config.enableLogging) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logPrefix = `[CORE ${timestamp}]`;
    
    switch (level) {
      case 'info':
        console.log(`${logPrefix} ${message}`);
        break;
      case 'warning':
        console.warn(`${logPrefix} WARNING: ${message}`);
        break;
      case 'error':
        console.error(`${logPrefix} ERROR: ${message}`);
        break;
    }
  }
}