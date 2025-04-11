/**
 * Base Agent Interface
 * 
 * This module defines the base interface and abstract class for all agents in the system.
 * It provides standard methods for processing requests, handling help requests,
 * sending messages, and learning from experiences.
 */

import { 
  AgentMessage, 
  AgentType, 
  EventType, 
  MessagePriority,
  ErrorCode,
  createMessage,
  createResponse,
  createErrorMessage,
  validateMessage
} from '../shared/agentProtocol';
import { AgentExperience } from '../shared/agentProtocol';

/**
 * Interface for the agent message bus callback
 */
export interface MessageBusCallback {
  (message: AgentMessage): void;
}

/**
 * Interface defining the core functionality all agents must implement
 */
export interface IAgent {
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the result
   */
  processRequest(request: any): Promise<any>;
  
  /**
   * Send a message to the MCP or another agent
   * @param message The message to send
   */
  sendMessage(message: AgentMessage): void;
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void>;
  
  /**
   * Learn from a set of experiences
   * @param experiences The experiences to learn from
   * @returns Promise resolving when learning is complete
   */
  learn(experiences: AgentExperience[]): Promise<void>;
  
  /**
   * Get the type of this agent
   * @returns The agent type
   */
  getAgentType(): AgentType;
  
  /**
   * Get the ID of this agent
   * @returns The agent ID
   */
  getAgentId(): string;
  
  /**
   * Get the capabilities of this agent
   * @returns Array of capability strings
   */
  getCapabilities(): string[];
  
  /**
   * Set the message bus callback for this agent
   * @param callback Function to call when sending messages
   */
  setMessageBusCallback(callback: MessageBusCallback): void;
  
  /**
   * Check if the agent is healthy
   * @returns True if the agent is healthy
   */
  isHealthy(): boolean;
  
  /**
   * Get performance metrics for this agent
   * @returns Object containing performance metrics
   */
  getMetrics(): Record<string, any>;
}

/**
 * Abstract base class implementing common agent functionality
 */
export abstract class BaseAgent implements IAgent {
  protected agentId: string;
  protected agentType: AgentType;
  protected messageBusCallback?: MessageBusCallback;
  protected startTime: Date;
  protected requestsProcessed: number;
  protected errorsEncountered: number;
  protected isActive: boolean;
  protected lastActivityTime: Date;
  protected processingTimes: number[];
  
  /**
   * Create a new agent
   * @param agentId Unique ID for this agent
   * @param agentType Type of this agent
   */
  constructor(agentId: string, agentType: AgentType) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.startTime = new Date();
    this.requestsProcessed = 0;
    this.errorsEncountered = 0;
    this.isActive = true;
    this.lastActivityTime = new Date();
    this.processingTimes = [];
  }
  
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the result
   */
  public abstract processRequest(request: any): Promise<any>;
  
  /**
   * Set the message bus callback for this agent
   * @param callback Function to call when sending messages
   */
  public setMessageBusCallback(callback: MessageBusCallback): void {
    this.messageBusCallback = callback;
  }
  
  /**
   * Send a message to the MCP or another agent
   * @param message The message to send
   */
  public sendMessage(message: AgentMessage): void {
    // Validate message before sending
    const validationResult = validateMessage(message);
    if (!validationResult.valid) {
      console.error('Invalid message:', validationResult.errors);
      return;
    }
    
    if (this.messageBusCallback) {
      this.messageBusCallback(message);
    } else {
      console.warn(`Agent ${this.agentId} attempted to send message but no message bus callback is set`);
    }
  }
  
  /**
   * Request help from other agents via the MCP
   * @param problemDescription Description of the problem
   * @param taskId ID of the task needing help
   * @param failedAttempts Number of failed attempts
   * @param lastError Last error encountered
   * @param contextData Additional context data
   */
  public requestHelp(
    problemDescription: string, 
    taskId: string, 
    failedAttempts: number = 1,
    lastError?: string,
    contextData?: any
  ): void {
    const message = createMessage(
      this.agentId,
      'MCP', // Always send help requests to the MCP for routing
      EventType.ASSISTANCE_REQUESTED,
      {
        problemDescription,
        taskId,
        failedAttempts,
        lastError,
        contextData
      },
      {
        metadata: {
          priority: MessagePriority.HIGH
        }
      }
    );
    
    this.sendMessage(message);
  }
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  public async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    // Default implementation - override in specific agents
    console.warn(`Agent ${this.agentId} cannot handle help request from ${requestingAgentId}`);
  }
  
  /**
   * Learn from a set of experiences
   * @param experiences The experiences to learn from
   * @returns Promise resolving when learning is complete
   */
  public async learn(experiences: AgentExperience[]): Promise<void> {
    // Default implementation - override in specific agents
    console.log(`Agent ${this.agentId} received ${experiences.length} experiences for learning`);
  }
  
  /**
   * Get the type of this agent
   * @returns The agent type
   */
  public getAgentType(): AgentType {
    return this.agentType;
  }
  
  /**
   * Get the ID of this agent
   * @returns The agent ID
   */
  public getAgentId(): string {
    return this.agentId;
  }
  
  /**
   * Get the capabilities of this agent
   * @returns Array of capability strings
   */
  public getCapabilities(): string[] {
    return [];
  }
  
  /**
   * Check if the agent is healthy
   * @returns True if the agent is healthy
   */
  public isHealthy(): boolean {
    // Basic health check - has been active recently
    const inactivityThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
    
    return this.isActive && timeSinceLastActivity < inactivityThreshold;
  }
  
  /**
   * Get performance metrics for this agent
   * @returns Object containing performance metrics
   */
  public getMetrics(): Record<string, any> {
    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;
      
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      uptime: Date.now() - this.startTime.getTime(),
      requestsProcessed: this.requestsProcessed,
      errorsEncountered: this.errorsEncountered,
      errorRate: this.requestsProcessed > 0 
        ? this.errorsEncountered / this.requestsProcessed 
        : 0,
      averageProcessingTime: avgProcessingTime,
      isHealthy: this.isHealthy(),
      lastActivityTime: this.lastActivityTime.toISOString()
    };
  }
  
  /**
   * Report a successful result
   * @param result The result data
   * @param processingTimeMs Processing time in milliseconds
   * @param notes Optional notes about the processing
   * @param correlationId Optional correlation ID for tracing
   */
  protected reportResult(
    result: any, 
    processingTimeMs: number, 
    notes?: string[],
    correlationId?: string
  ): void {
    this.requestsProcessed++;
    this.lastActivityTime = new Date();
    this.processingTimes.push(processingTimeMs);
    
    // Keep processing times array from growing too large
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    const message = createMessage(
      this.agentId,
      'MCP', // Report results to the MCP
      EventType.RESPONSE,
      {
        status: 'success',
        result,
        processingTimeMs,
        notes
      },
      {
        correlationId,
        metadata: {
          processingTime: processingTimeMs
        }
      }
    );
    
    this.sendMessage(message);
  }
  
  /**
   * Report an error
   * @param error The error that occurred
   * @param taskId Optional task ID
   * @param correlationId Optional correlation ID for tracing
   */
  protected reportError(
    error: Error, 
    taskId?: string,
    correlationId?: string
  ): void {
    this.errorsEncountered++;
    this.lastActivityTime = new Date();
    
    const message = createMessage(
      this.agentId,
      'MCP', // Report errors to the MCP
      EventType.ERROR,
      {
        errorCode: ErrorCode.PROCESSING_ERROR,
        errorMessage: error.message,
        details: {
          stack: error.stack,
          taskId
        }
      },
      {
        correlationId,
        metadata: {
          priority: MessagePriority.HIGH
        }
      }
    );
    
    this.sendMessage(message);
  }
  
  /**
   * Send a status update
   */
  protected sendStatusUpdate(): void {
    const metrics = this.getMetrics();
    
    const message = createMessage(
      this.agentId,
      'MCP', // Send status updates to the MCP
      EventType.STATUS_UPDATE,
      {
        status: this.isHealthy() ? 'healthy' : 'degraded',
        metrics: {
          requestsProcessed: metrics.requestsProcessed,
          errorsEncountered: metrics.errorsEncountered,
          errorRate: metrics.errorRate,
          averageProcessingTime: metrics.averageProcessingTime
        }
      }
    );
    
    this.sendMessage(message);
  }
}