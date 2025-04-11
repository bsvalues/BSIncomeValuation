/**
 * Master Control Program (MCP)
 * 
 * The MCP is the central coordination system for the Agent Army. It manages agent
 * registration, message routing, experience collection, and learning triggers.
 */

import { 
  AgentMessage, 
  EventType, 
  AgentType,
  validateMessage,
  createMessage
} from '../shared/agentProtocol';
import { IReplayBuffer, createReplayBuffer } from './ReplayBuffer';
import { IAgent, MessageBusCallback } from './BaseAgent';

/**
 * Interface for agent performance metrics
 */
export interface AgentPerformanceMetrics {
  successRate: number;
  averageProcessingTime: number;
  errorCount: number;
  lastUpdated: Date;
  healthStatus: 'healthy' | 'degraded' | 'error';
  capabilities: string[];
}

/**
 * Interface for agent configuration
 */
export interface AgentConfig {
  enabled: boolean;
  performanceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
}

/**
 * Configuration for the MCP
 */
export interface MCPConfig {
  replayBuffer: {
    type: 'memory' | 'postgres' | 'redis';
    maxSize?: number;
    priorityThreshold?: number;
    connectionString?: string;
  };
  training: {
    triggerThreshold: number;
    sampleSize: number;
    minPriority?: number;
  };
  defaultAgentConfig: AgentConfig;
}

/**
 * Master Control Program implementation
 */
export class MasterControlProgram {
  private agents: Map<string, IAgent> = new Map();
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private agentConfigs: Map<AgentType, AgentConfig> = new Map();
  private replayBuffer: IReplayBuffer;
  private config: MCPConfig;
  private messageListeners: Set<MessageBusCallback> = new Set();
  
  /**
   * Create a new MCP instance
   * @param config Configuration for the MCP
   */
  constructor(config: MCPConfig) {
    this.config = config;
    
    // Create replay buffer
    this.replayBuffer = createReplayBuffer(config.replayBuffer);
    
    // Set default agent configurations
    Object.values(AgentType).forEach(type => {
      this.agentConfigs.set(type as AgentType, { ...config.defaultAgentConfig });
    });
    
    // Schedule periodic status checks and training
    setInterval(() => this.performPeriodicTasks(), 60000); // Every minute
  }
  
  /**
   * Register an agent with the MCP
   * @param agent The agent to register
   */
  public registerAgent(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const agentType = agent.getAgentType();
    
    // Set message bus callback
    agent.setMessageBusCallback((message: AgentMessage) => {
      this.handleAgentMessage(message);
    });
    
    // Store agent reference
    this.agents.set(agentId, agent);
    
    // Initialize metrics for this agent
    this.agentMetrics.set(agentId, {
      successRate: 1.0,
      averageProcessingTime: 0,
      errorCount: 0,
      lastUpdated: new Date(),
      healthStatus: 'healthy',
      capabilities: agent.getCapabilities()
    });
    
    console.log(`Agent ${agentId} of type ${agentType} registered with MCP`);
    
    // Notify agent registration
    this.sendSystemEvent({
      eventType: EventType.EVENT,
      payload: {
        event: 'agent_registered',
        agentId,
        agentType,
        capabilities: agent.getCapabilities()
      }
    });
  }
  
  /**
   * Unregister an agent from the MCP
   * @param agentId ID of the agent to unregister
   */
  public unregisterAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      const agent = this.agents.get(agentId);
      this.agents.delete(agentId);
      this.agentMetrics.delete(agentId);
      
      console.log(`Agent ${agentId} unregistered from MCP`);
      
      // Notify agent unregistration
      this.sendSystemEvent({
        eventType: EventType.EVENT,
        payload: {
          event: 'agent_unregistered',
          agentId,
          agentType: agent?.getAgentType()
        }
      });
    }
  }
  
  /**
   * Add a message listener to receive all messages
   * @param listener The listener function
   */
  public addMessageListener(listener: MessageBusCallback): void {
    this.messageListeners.add(listener);
  }
  
  /**
   * Remove a message listener
   * @param listener The listener function to remove
   */
  public removeMessageListener(listener: MessageBusCallback): void {
    this.messageListeners.delete(listener);
  }
  
  /**
   * Handle a message from an agent
   * @param message The message to handle
   */
  public handleAgentMessage(message: AgentMessage): void {
    // Validate message
    const validationResult = validateMessage(message);
    if (!validationResult.valid) {
      console.error('MCP received invalid message:', validationResult.errors);
      return;
    }
    
    // Log experience to replay buffer if appropriate
    this.logExperienceIfApplicable(message);
    
    // Notify all listeners
    this.notifyListeners(message);
    
    // Process message based on event type
    switch (message.eventType) {
      case EventType.COMMAND:
        this.handleCommandMessage(message);
        break;
      case EventType.QUERY:
        this.handleQueryMessage(message);
        break;
      case EventType.ERROR:
        this.handleErrorMessage(message);
        break;
      case EventType.ASSISTANCE_REQUESTED:
        this.handleAssistanceRequest(message);
        break;
      case EventType.RESPONSE:
        this.handleResponseMessage(message);
        break;
      case EventType.STATUS_UPDATE:
        this.handleStatusUpdate(message);
        break;
      default:
        // Just store for replay; specific handling not needed
        break;
    }
    
    // Check if we should trigger training
    this.checkAndTriggerTraining();
  }
  
  /**
   * Send a message to a specific agent
   * @param targetAgentId ID of the target agent
   * @param eventType Type of event
   * @param payload Message payload
   * @param options Additional options
   * @returns True if the message was sent successfully
   */
  public sendMessageToAgent(
    targetAgentId: string,
    eventType: EventType,
    payload: any,
    options: {
      correlationId?: string;
      metadata?: any;
    } = {}
  ): boolean {
    if (!this.agents.has(targetAgentId)) {
      console.warn(`Cannot send message to unknown agent: ${targetAgentId}`);
      return false;
    }
    
    const message = createMessage(
      'MCP',
      targetAgentId,
      eventType,
      payload,
      options
    );
    
    // Notify all listeners
    this.notifyListeners(message);
    
    // Find agent and deliver message
    const agent = this.agents.get(targetAgentId);
    if (agent) {
      switch(eventType) {
        case EventType.COMMAND:
          // Process command
          this.processAgentCommand(agent, message);
          break;
        default:
          // For other message types, just deliver the message
          try {
            agent.sendMessage(message);
          } catch (error) {
            console.error(`Error sending message to agent ${targetAgentId}:`, error);
            return false;
          }
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Broadcast a message to all agents
   * @param eventType Type of event
   * @param payload Message payload
   * @param options Additional options
   */
  public broadcastMessage(
    eventType: EventType,
    payload: any,
    options: {
      correlationId?: string;
      metadata?: any;
    } = {}
  ): void {
    const message = createMessage(
      'MCP',
      'broadcast',
      eventType,
      payload,
      options
    );
    
    // Notify all listeners
    this.notifyListeners(message);
    
    // Send to all agents
    this.agents.forEach(agent => {
      try {
        agent.sendMessage(message);
      } catch (error) {
        console.error(`Error broadcasting message to agent ${agent.getAgentId()}:`, error);
      }
    });
  }
  
  /**
   * Get metrics for all registered agents
   * @returns Object mapping agent IDs to their metrics
   */
  public getAgentMetrics(): Record<string, AgentPerformanceMetrics> {
    const metrics: Record<string, AgentPerformanceMetrics> = {};
    this.agentMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }
  
  /**
   * Get the size of the replay buffer
   * @returns Number of experiences in the buffer
   */
  public getReplayBufferSize(): number {
    return this.replayBuffer.size();
  }
  
  /**
   * Get a sample of experiences from the replay buffer
   * @param count Number of experiences to sample
   * @returns Array of sampled experiences
   */
  public sampleExperiences(count: number): any[] {
    return this.replayBuffer.sample(count);
  }
  
  /**
   * Find an agent that can handle a specific capability
   * @param capability The capability to look for
   * @returns The agent ID or null if no suitable agent found
   */
  public findAgentWithCapability(capability: string): string | null {
    // Find agents with the requested capability
    const matchingAgents: string[] = [];
    
    this.agentMetrics.forEach((metrics, agentId) => {
      if (metrics.capabilities.includes(capability)) {
        matchingAgents.push(agentId);
      }
    });
    
    if (matchingAgents.length === 0) {
      return null;
    }
    
    // If multiple agents match, prefer the one with highest success rate
    if (matchingAgents.length > 1) {
      matchingAgents.sort((a, b) => {
        const metricsA = this.agentMetrics.get(a);
        const metricsB = this.agentMetrics.get(b);
        
        if (!metricsA || !metricsB) return 0;
        
        return metricsB.successRate - metricsA.successRate;
      });
    }
    
    return matchingAgents[0];
  }
  
  /**
   * Trigger training based on collected experiences
   */
  public triggerTraining(): void {
    console.log('MCP: Triggering agent training...');
    
    // Get training sample from replay buffer
    const experiences = this.replayBuffer.sample(
      this.config.training.sampleSize,
      this.config.training.minPriority
    );
    
    if (experiences.length === 0) {
      console.log('No experiences available for training');
      return;
    }
    
    // Group experiences by agent
    const experiencesByAgent = new Map<string, any[]>();
    
    experiences.forEach(exp => {
      const agentId = exp.agentId;
      if (!experiencesByAgent.has(agentId)) {
        experiencesByAgent.set(agentId, []);
      }
      experiencesByAgent.get(agentId)?.push(exp);
    });
    
    // Train each agent with its experiences
    experiencesByAgent.forEach((agentExperiences, agentId) => {
      const agent = this.agents.get(agentId);
      if (agent) {
        console.log(`Training agent ${agentId} with ${agentExperiences.length} experiences`);
        agent.learn(agentExperiences)
          .then(() => {
            console.log(`Training completed for agent ${agentId}`);
          })
          .catch(error => {
            console.error(`Error training agent ${agentId}:`, error);
          });
      }
    });
    
    // Notify system event
    this.sendSystemEvent({
      eventType: EventType.EVENT,
      payload: {
        event: 'training_triggered',
        experienceCount: experiences.length,
        agentCount: experiencesByAgent.size
      }
    });
  }
  
  /**
   * Process a command for an agent
   * @param agent The agent to process the command
   * @param message The command message
   */
  private async processAgentCommand(agent: IAgent, message: AgentMessage): Promise<void> {
    try {
      // Extract command name and parameters
      const { commandName, parameters } = message.payload;
      
      // Check if we're requesting a specific capability
      if (commandName === 'process_request') {
        const result = await agent.processRequest(parameters);
        
        // Send response back to original sender
        const responseMessage = createMessage(
          'MCP',
          message.sourceAgentId,
          EventType.RESPONSE,
          {
            status: 'success',
            result,
            command: commandName
          },
          {
            correlationId: message.correlationId
          }
        );
        
        this.notifyListeners(responseMessage);
        
        if (message.sourceAgentId !== 'MCP') {
          const sourceAgent = this.agents.get(message.sourceAgentId);
          if (sourceAgent) {
            sourceAgent.sendMessage(responseMessage);
          }
        }
      }
      // Other command handling as needed
    } catch (error) {
      console.error(`Error processing command for agent ${agent.getAgentId()}:`, error);
      
      // Send error response back to original sender
      const errorMessage = createMessage(
        'MCP',
        message.sourceAgentId,
        EventType.ERROR,
        {
          errorCode: 'COMMAND_PROCESSING_ERROR',
          errorMessage: (error as Error).message,
          command: message.payload.commandName
        },
        {
          correlationId: message.correlationId
        }
      );
      
      this.notifyListeners(errorMessage);
      
      if (message.sourceAgentId !== 'MCP') {
        const sourceAgent = this.agents.get(message.sourceAgentId);
        if (sourceAgent) {
          sourceAgent.sendMessage(errorMessage);
        }
      }
    }
  }
  
  /**
   * Handle a command message
   * @param message The command message
   */
  private handleCommandMessage(message: AgentMessage): void {
    // If the target is a specific agent, forward the command
    if (message.targetAgentId !== 'MCP' && message.targetAgentId !== 'broadcast') {
      const targetAgent = this.agents.get(message.targetAgentId);
      if (targetAgent) {
        this.processAgentCommand(targetAgent, message);
      } else {
        console.warn(`Command targeted at unknown agent: ${message.targetAgentId}`);
      }
      return;
    }
    
    // If the command is for the MCP, handle it directly
    if (message.targetAgentId === 'MCP') {
      // Handle MCP-specific commands
      try {
        const { commandName, parameters } = message.payload;
        
        switch (commandName) {
          case 'get_agent_metrics':
            const metrics = this.getAgentMetrics();
            this.sendResponseToAgent(
              message.sourceAgentId,
              { metrics },
              message.correlationId
            );
            break;
          
          case 'trigger_training':
            this.triggerTraining();
            this.sendResponseToAgent(
              message.sourceAgentId,
              { status: 'training_triggered' },
              message.correlationId
            );
            break;
          
          case 'find_agent_with_capability':
            const capability = parameters?.capability;
            if (!capability) {
              throw new Error('Capability parameter is required');
            }
            
            const agentId = this.findAgentWithCapability(capability);
            this.sendResponseToAgent(
              message.sourceAgentId,
              { agentId },
              message.correlationId
            );
            break;
          
          default:
            console.warn(`Unknown MCP command: ${commandName}`);
            throw new Error(`Unknown MCP command: ${commandName}`);
        }
      } catch (error) {
        console.error('Error handling MCP command:', error);
        
        this.sendErrorToAgent(
          message.sourceAgentId,
          'COMMAND_ERROR',
          (error as Error).message,
          message.correlationId
        );
      }
    }
  }
  
  /**
   * Handle a query message
   * @param message The query message
   */
  private handleQueryMessage(message: AgentMessage): void {
    // Similar to command message handling, but for queries
    // Implement as needed for specific query types
  }
  
  /**
   * Handle an error message
   * @param message The error message
   */
  private handleErrorMessage(message: AgentMessage): void {
    const { agentId } = message;
    
    // Update error metrics
    const metrics = this.agentMetrics.get(message.sourceAgentId);
    if (metrics) {
      metrics.errorCount++;
      metrics.successRate = Math.max(0, metrics.successRate - 0.1);
      metrics.lastUpdated = new Date();
      
      // If too many errors, mark as degraded
      if (metrics.errorCount > 5 && metrics.successRate < 0.5) {
        metrics.healthStatus = 'degraded';
      }
      
      this.agentMetrics.set(message.sourceAgentId, metrics);
    }
    
    // Log high-priority error for review
    console.error(`Agent ${message.sourceAgentId} reported error:`, message.payload);
  }
  
  /**
   * Handle a response message
   * @param message The response message
   */
  private handleResponseMessage(message: AgentMessage): void {
    // Update agent metrics based on response
    const metrics = this.agentMetrics.get(message.sourceAgentId);
    if (metrics && message.metadata?.processingTime) {
      const processingTime = message.metadata.processingTime;
      
      // Update processing time with running average
      metrics.averageProcessingTime = metrics.averageProcessingTime === 0 
        ? processingTime 
        : (metrics.averageProcessingTime * 0.7) + (processingTime * 0.3);
      
      // Update success rate
      if (message.payload.status === 'success') {
        metrics.successRate = Math.min(1.0, metrics.successRate + 0.02);
      }
      
      metrics.lastUpdated = new Date();
      this.agentMetrics.set(message.sourceAgentId, metrics);
    }
    
    // If response has a target other than MCP, forward it
    if (message.targetAgentId !== 'MCP') {
      const targetAgent = this.agents.get(message.targetAgentId);
      if (targetAgent) {
        targetAgent.sendMessage(message);
      }
    }
  }
  
  /**
   * Handle a status update message
   * @param message The status update message
   */
  private handleStatusUpdate(message: AgentMessage): void {
    const { status, metrics } = message.payload;
    
    // Update agent metrics
    const agentMetrics = this.agentMetrics.get(message.sourceAgentId);
    if (agentMetrics) {
      agentMetrics.healthStatus = status;
      agentMetrics.lastUpdated = new Date();
      
      if (metrics) {
        // Update with reported metrics
        if (metrics.averageProcessingTime !== undefined) {
          agentMetrics.averageProcessingTime = metrics.averageProcessingTime;
        }
        
        if (metrics.errorCount !== undefined) {
          agentMetrics.errorCount = metrics.errorCount;
        }
        
        if (metrics.errorRate !== undefined) {
          agentMetrics.successRate = 1 - metrics.errorRate;
        }
      }
      
      this.agentMetrics.set(message.sourceAgentId, agentMetrics);
    }
  }
  
  /**
   * Handle an assistance request
   * @param message The assistance request message
   */
  private handleAssistanceRequest(message: AgentMessage): void {
    const payload = message.payload;
    
    console.log(`Help requested by ${message.sourceAgentId}:`, payload.problemDescription);
    
    // Determine which agent can best handle this request
    let helperAgentId: string | null = null;
    
    // Use problem description for keyword matching
    const problemDescription = payload.problemDescription.toLowerCase();
    
    // Simple keyword matching to common agent capabilities
    if (problemDescription.includes('valuation') || 
        problemDescription.includes('income') ||
        problemDescription.includes('multiplier')) {
      helperAgentId = this.findAgentWithCapability('income_analysis') || 
                     this.findAgentWithCapability('valuation_calculation');
    } 
    else if (problemDescription.includes('data quality') || 
             problemDescription.includes('validation') ||
             problemDescription.includes('duplicate')) {
      helperAgentId = this.findAgentWithCapability('data_validation') ||
                     this.findAgentWithCapability('duplicate_detection');
    } 
    else if (problemDescription.includes('report') || 
             problemDescription.includes('insight') ||
             problemDescription.includes('summary')) {
      helperAgentId = this.findAgentWithCapability('report_generation') ||
                     this.findAgentWithCapability('insight_generation');
    }
    
    if (helperAgentId) {
      // Delegate the task to the helper agent
      const helperAgent = this.agents.get(helperAgentId);
      if (helperAgent) {
        console.log(`Delegating help request to ${helperAgentId}`);
        
        helperAgent.handleHelpRequest(payload, message.sourceAgentId)
          .then(() => {
            console.log(`Agent ${helperAgentId} provided assistance to ${message.sourceAgentId}`);
          })
          .catch(error => {
            console.error(`Error providing help from ${helperAgentId}:`, error);
          });
      }
    } else {
      console.warn(`No suitable agent found to help with request from ${message.sourceAgentId}`);
      
      // Send back response that no helper was found
      this.sendResponseToAgent(
        message.sourceAgentId,
        {
          status: 'no_helper_found',
          message: 'No suitable agent found to help with this request'
        },
        message.correlationId
      );
    }
  }
  
  /**
   * Check if we should trigger training
   */
  private checkAndTriggerTraining(): void {
    if (this.replayBuffer.size() >= this.config.training.triggerThreshold) {
      this.triggerTraining();
    }
  }
  
  /**
   * Log an experience to the replay buffer if the message is appropriate
   * @param message The message to potentially log
   */
  private logExperienceIfApplicable(message: AgentMessage): void {
    // For now, we only log RESPONSE, ERROR, and ASSISTANCE_REQUESTED messages
    if (![EventType.RESPONSE, EventType.ERROR, EventType.ASSISTANCE_REQUESTED].includes(message.eventType)) {
      return;
    }
    
    // Create an experience entry
    const experience = {
      experienceId: message.messageId, // Reuse message ID
      agentId: message.sourceAgentId,
      timestamp: message.timestamp,
      state: message.payload.state || {},
      action: message.payload.action || {},
      result: message.payload.result || message.payload, // Use full payload for non-standard messages
      nextState: message.payload.nextState || {},
      rewardSignal: this.calculateRewardSignal(message),
      metadata: {
        priority: this.calculateExperiencePriority(message),
        messageType: message.eventType,
        correlationId: message.correlationId
      }
    };
    
    // Add to replay buffer
    this.replayBuffer.add(experience);
  }
  
  /**
   * Calculate a reward signal for reinforcement learning
   * @param message The message to calculate reward for
   * @returns The reward signal value
   */
  private calculateRewardSignal(message: AgentMessage): number {
    switch (message.eventType) {
      case EventType.RESPONSE:
        return message.payload.status === 'success' ? 1.0 : -0.5;
      case EventType.ERROR:
        return -1.0;
      case EventType.ASSISTANCE_REQUESTED:
        return -0.2; // Small negative reward for needing help
      default:
        return 0;
    }
  }
  
  /**
   * Calculate the priority of an experience for the replay buffer
   * @param message The message to calculate priority for
   * @returns Priority value between 0 and 1
   */
  private calculateExperiencePriority(message: AgentMessage): number {
    switch (message.eventType) {
      case EventType.ERROR:
        return 0.9; // High priority for errors
      case EventType.ASSISTANCE_REQUESTED:
        return 0.8; // High priority for help requests
      case EventType.RESPONSE:
        // Higher priority for unusual responses (very fast/slow, low confidence)
        if (message.metadata?.processingTime) {
          const processingTime = message.metadata.processingTime;
          const metrics = this.agentMetrics.get(message.sourceAgentId);
          
          if (metrics) {
            const avgTime = metrics.averageProcessingTime;
            
            // If processing time is significantly different from average
            if (avgTime > 0 && (processingTime < avgTime * 0.5 || processingTime > avgTime * 2)) {
              return 0.7;
            }
          }
        }
        
        if (message.metadata?.confidenceScore) {
          const confidence = message.metadata.confidenceScore;
          
          // Low confidence responses are more interesting
          if (confidence < 50) {
            return 0.7;
          }
        }
        
        return 0.5; // Medium priority for normal responses
      default:
        return 0.3; // Low priority for other messages
    }
  }
  
  /**
   * Notify all message listeners of a message
   * @param message The message to broadcast to listeners
   */
  private notifyListeners(message: AgentMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }
  
  /**
   * Send a response message to an agent
   * @param targetAgentId Target agent ID
   * @param payload Response payload
   * @param correlationId Optional correlation ID
   */
  private sendResponseToAgent(
    targetAgentId: string,
    payload: any,
    correlationId?: string
  ): void {
    this.sendMessageToAgent(
      targetAgentId,
      EventType.RESPONSE,
      {
        status: 'success',
        result: payload
      },
      {
        correlationId
      }
    );
  }
  
  /**
   * Send an error message to an agent
   * @param targetAgentId Target agent ID
   * @param errorCode Error code
   * @param errorMessage Error message
   * @param correlationId Optional correlation ID
   */
  private sendErrorToAgent(
    targetAgentId: string,
    errorCode: string,
    errorMessage: string,
    correlationId?: string
  ): void {
    this.sendMessageToAgent(
      targetAgentId,
      EventType.ERROR,
      {
        errorCode,
        errorMessage
      },
      {
        correlationId
      }
    );
  }
  
  /**
   * Send a system event message to all listeners
   * @param options Event options
   */
  private sendSystemEvent(options: {
    eventType: EventType;
    payload: any;
    correlationId?: string;
  }): void {
    const message = createMessage(
      'MCP',
      'system',
      options.eventType,
      options.payload,
      {
        correlationId: options.correlationId
      }
    );
    
    this.notifyListeners(message);
  }
  
  /**
   * Perform periodic tasks such as health checks and training
   */
  private performPeriodicTasks(): void {
    // Check agent health
    this.agents.forEach((agent, agentId) => {
      const isHealthy = agent.isHealthy();
      
      // Update metrics
      const metrics = this.agentMetrics.get(agentId);
      if (metrics) {
        metrics.healthStatus = isHealthy ? 'healthy' : 'degraded';
        metrics.lastUpdated = new Date();
        this.agentMetrics.set(agentId, metrics);
      }
      
      // If unhealthy, log a warning
      if (!isHealthy) {
        console.warn(`Agent ${agentId} health check failed`);
      }
    });
    
    // Check if training is needed
    if (this.replayBuffer.size() >= this.config.training.triggerThreshold) {
      this.triggerTraining();
    }
  }
}