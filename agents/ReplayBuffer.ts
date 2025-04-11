/**
 * ReplayBuffer Implementation
 * 
 * This module provides a memory-based replay buffer for storing agent experiences
 * with prioritization capabilities. In a production environment, this would be
 * backed by a persistent store like PostgreSQL or Redis.
 */

import { AgentExperience } from '../shared/agentProtocol';

/**
 * Interface for a replay buffer that stores agent experiences
 */
export interface IReplayBuffer {
  /**
   * Add an experience to the buffer
   * @param experience Experience to add
   */
  add(experience: AgentExperience): void;
  
  /**
   * Get a sample of experiences from the buffer
   * @param count Number of experiences to retrieve
   * @param minPriority Optional minimum priority threshold
   * @returns Array of experiences
   */
  sample(count: number, minPriority?: number): AgentExperience[];
  
  /**
   * Get all experiences in the buffer
   * @returns Array of all experiences
   */
  getAll(): AgentExperience[];
  
  /**
   * Get experiences for a specific agent
   * @param agentId ID of the agent
   * @returns Array of experiences for the agent
   */
  getByAgentId(agentId: string): AgentExperience[];
  
  /**
   * Get high priority experiences from the buffer
   * @param threshold Priority threshold (0-1)
   * @returns Array of high priority experiences
   */
  getHighPriorityExperiences(threshold: number): AgentExperience[];
  
  /**
   * Get the number of experiences in the buffer
   * @returns Count of experiences
   */
  size(): number;
  
  /**
   * Clear all experiences from the buffer
   */
  clear(): void;
}

/**
 * In-memory implementation of a replay buffer with prioritization
 */
export class MemoryReplayBuffer implements IReplayBuffer {
  private buffer: AgentExperience[] = [];
  private maxSize: number;
  private priorityThreshold: number;
  
  /**
   * Create a new memory replay buffer
   * @param maxSize Maximum number of experiences to store
   * @param priorityThreshold Default threshold for high priority experiences
   */
  constructor(maxSize: number = 1000, priorityThreshold: number = 0.7) {
    this.maxSize = maxSize;
    this.priorityThreshold = priorityThreshold;
  }
  
  /**
   * Add an experience to the buffer
   * @param experience Experience to add
   */
  public add(experience: AgentExperience): void {
    this.buffer.push(experience);
    
    // Keep buffer size within limits
    if (this.buffer.length > this.maxSize) {
      // Remove lowest priority experiences first
      this.buffer.sort((a, b) => 
        (a.metadata.priority || 0) - (b.metadata.priority || 0)
      );
      this.buffer.shift();
    }
    
    // Sort by priority (descending) so high priority items are sampled more often
    this.buffer.sort((a, b) => 
      (b.metadata.priority || 0) - (a.metadata.priority || 0)
    );
  }
  
  /**
   * Get a sample of experiences from the buffer using prioritized sampling
   * @param count Number of experiences to sample
   * @param minPriority Minimum priority threshold (optional)
   * @returns Array of sampled experiences
   */
  public sample(count: number = 10, minPriority?: number): AgentExperience[] {
    if (this.buffer.length === 0) {
      return [];
    }
    
    // Filter by minimum priority if specified
    let eligibleExperiences = this.buffer;
    if (minPriority !== undefined) {
      eligibleExperiences = this.buffer.filter(exp => 
        (exp.metadata.priority || 0) >= minPriority
      );
      
      if (eligibleExperiences.length === 0) {
        return [];
      }
    }
    
    if (eligibleExperiences.length <= count) {
      return [...eligibleExperiences];
    }
    
    // Prioritized sampling
    const sampledIndices = new Set<number>();
    const result: AgentExperience[] = [];
    
    // First add some high priority samples
    const highPriorityCount = Math.floor(count * 0.7);
    for (let i = 0; i < highPriorityCount && i < eligibleExperiences.length; i++) {
      result.push(eligibleExperiences[i]);
      sampledIndices.add(i);
    }
    
    // Then add some random samples from the remaining experiences
    while (result.length < count && sampledIndices.size < eligibleExperiences.length) {
      const idx = Math.floor(Math.random() * eligibleExperiences.length);
      if (!sampledIndices.has(idx)) {
        result.push(eligibleExperiences[idx]);
        sampledIndices.add(idx);
      }
    }
    
    return result;
  }
  
  /**
   * Get all experiences in the buffer
   * @returns Array of all experiences
   */
  public getAll(): AgentExperience[] {
    return [...this.buffer];
  }
  
  /**
   * Get experiences for a specific agent
   * @param agentId ID of the agent
   * @returns Array of experiences for the agent
   */
  public getByAgentId(agentId: string): AgentExperience[] {
    return this.buffer.filter(exp => exp.agentId === agentId);
  }
  
  /**
   * Get high priority experiences from the buffer
   * @param threshold Priority threshold (0-1)
   * @returns Array of high priority experiences
   */
  public getHighPriorityExperiences(threshold: number = this.priorityThreshold): AgentExperience[] {
    return this.buffer.filter(exp => (exp.metadata.priority || 0) >= threshold);
  }
  
  /**
   * Get the number of experiences in the buffer
   * @returns Count of experiences
   */
  public size(): number {
    return this.buffer.length;
  }
  
  /**
   * Clear all experiences from the buffer
   */
  public clear(): void {
    this.buffer = [];
  }
}

/**
 * Factory function to create the appropriate replay buffer based on configuration
 * @param config Configuration object
 * @returns Replay buffer instance
 */
export function createReplayBuffer(config: {
  type: 'memory' | 'postgres' | 'redis';
  maxSize?: number;
  priorityThreshold?: number;
  connectionString?: string;
}): IReplayBuffer {
  switch (config.type) {
    case 'memory':
      return new MemoryReplayBuffer(
        config.maxSize,
        config.priorityThreshold
      );
    case 'postgres':
      // In a production environment, implement PostgreSQL-backed replay buffer
      console.warn('PostgreSQL replay buffer not yet implemented, using in-memory buffer');
      return new MemoryReplayBuffer(
        config.maxSize,
        config.priorityThreshold
      );
    case 'redis':
      // In a production environment, implement Redis-backed replay buffer
      console.warn('Redis replay buffer not yet implemented, using in-memory buffer');
      return new MemoryReplayBuffer(
        config.maxSize,
        config.priorityThreshold
      );
    default:
      console.warn(`Unknown replay buffer type: ${config.type}, using in-memory buffer`);
      return new MemoryReplayBuffer(
        config.maxSize,
        config.priorityThreshold
      );
  }
}