/**
 * Agent Communication Protocol for Benton County Assessor's Office AI Platform
 * 
 * This module defines the standardized message format and types used for
 * communication between the MCP (Master Control Program) and the Agent Army.
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enumeration of possible message event types
 */
export enum EventType {
  COMMAND = 'COMMAND',
  EVENT = 'EVENT',
  QUERY = 'QUERY',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  STATUS_UPDATE = 'STATUS_UPDATE',
  ASSISTANCE_REQUESTED = 'ASSISTANCE_REQUESTED'
}

/**
 * Enumeration of agent types in the system
 */
export enum AgentType {
  MCP = 'MCP',
  VALUATION = 'VALUATION',
  DATA_CLEANER = 'DATA_CLEANER',
  REPORTING = 'REPORTING',
  DATA_INTEGRATION = 'DATA_INTEGRATION',
  NLP = 'NLP',
  COMPLIANCE = 'COMPLIANCE'
}

/**
 * Enumeration of possible message priorities
 */
export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Enumeration of common error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for message metadata
 */
export interface MessageMetadata {
  priority?: MessagePriority;
  ttl?: number; // Time to live in seconds
  retryCount?: number;
  processingTime?: number; // Processing time in milliseconds
  confidenceScore?: number; // Confidence score of the result (0-100)
  [key: string]: any; // Allow for additional custom metadata
}

/**
 * Zod schema for validating metadata
 */
export const MetadataSchema = z.object({
  priority: z.enum([
    MessagePriority.LOW,
    MessagePriority.MEDIUM,
    MessagePriority.HIGH
  ]).optional(),
  ttl: z.number().positive().optional(),
  retryCount: z.number().nonnegative().optional(),
  processingTime: z.number().nonnegative().optional(),
  confidenceScore: z.number().min(0).max(100).optional()
}).passthrough(); // Allow additional properties

/**
 * Base interface for agent messages
 */
export interface AgentMessage {
  messageId: string;
  correlationId: string;
  sourceAgentId: string;
  targetAgentId: string; // Can be specific agent ID or "broadcast"
  timestamp: string;
  eventType: EventType;
  payload: any;
  metadata?: MessageMetadata;
}

/**
 * Zod schema for validating the core message structure
 */
export const AgentMessageSchema = z.object({
  messageId: z.string().uuid(),
  correlationId: z.string().uuid(),
  sourceAgentId: z.string().min(1),
  targetAgentId: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  eventType: z.nativeEnum(EventType),
  payload: z.any(),
  metadata: MetadataSchema.optional()
});

/**
 * Interface for command payloads
 */
export interface CommandPayload {
  commandName: string;
  parameters: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for response payloads
 */
export interface ResponsePayload {
  status: 'success' | 'failure';
  result: any;
  [key: string]: any;
}

/**
 * Interface for error payloads
 */
export interface ErrorPayload {
  errorCode: ErrorCode | string;
  errorMessage: string;
  details?: any;
  [key: string]: any;
}

/**
 * Interface for status update payloads
 */
export interface StatusUpdatePayload {
  status: 'healthy' | 'degraded' | 'error';
  metrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    activeTaskCount?: number;
    queueDepth?: number;
    lastProcessingTime?: number;
    errorRate?: number;
    [key: string]: any;
  };
  message?: string;
  [key: string]: any;
}

/**
 * Interface for assistance request payloads
 */
export interface AssistanceRequestPayload {
  problemDescription: string;
  taskId: string;
  failedAttempts: number;
  lastError?: string;
  contextData?: any;
  [key: string]: any;
}

/**
 * Interface for logged agent experiences in the replay buffer
 */
export interface AgentExperience {
  experienceId: string;
  agentId: string;
  timestamp: string;
  state: any; // State before action
  action: any; // Action taken
  result: any; // Result/outcome
  nextState: any; // State after action
  rewardSignal?: number; // Optional reward signal for RL-based learning
  metadata: {
    priority: number; // Priority for replay (0-1)
    [key: string]: any;
  };
}

/**
 * Function to create a new message
 */
export function createMessage(
  sourceAgentId: string,
  targetAgentId: string,
  eventType: EventType,
  payload: any,
  options: {
    correlationId?: string;
    metadata?: MessageMetadata;
  } = {}
): AgentMessage {
  return {
    messageId: uuidv4(),
    correlationId: options.correlationId || uuidv4(),
    sourceAgentId,
    targetAgentId,
    timestamp: new Date().toISOString(),
    eventType,
    payload,
    metadata: options.metadata
  };
}

/**
 * Function to create a response message
 */
export function createResponse(
  requestMessage: AgentMessage,
  status: 'success' | 'failure',
  result: any,
  metadata?: MessageMetadata
): AgentMessage {
  return {
    messageId: uuidv4(),
    correlationId: requestMessage.correlationId,
    sourceAgentId: requestMessage.targetAgentId,
    targetAgentId: requestMessage.sourceAgentId,
    timestamp: new Date().toISOString(),
    eventType: EventType.RESPONSE,
    payload: {
      status,
      result
    },
    metadata
  };
}

/**
 * Function to create an error message
 */
export function createErrorMessage(
  requestMessage: AgentMessage,
  errorCode: ErrorCode | string,
  errorMessage: string,
  details?: any,
  metadata?: MessageMetadata
): AgentMessage {
  return {
    messageId: uuidv4(),
    correlationId: requestMessage.correlationId,
    sourceAgentId: requestMessage.targetAgentId,
    targetAgentId: requestMessage.sourceAgentId,
    timestamp: new Date().toISOString(),
    eventType: EventType.ERROR,
    payload: {
      errorCode,
      errorMessage,
      details
    },
    metadata: {
      ...metadata,
      priority: MessagePriority.HIGH
    }
  };
}

/**
 * Function to validate a message
 */
export function validateMessage(message: any): { valid: boolean; errors?: z.ZodError } {
  try {
    AgentMessageSchema.parse(message);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}

/**
 * Function to create an experience entry for the replay buffer
 */
export function createExperience(
  agentId: string,
  state: any,
  action: any,
  result: any,
  nextState: any,
  options: {
    rewardSignal?: number;
    priority?: number; // 0-1 scale, higher means more important
  } = {}
): AgentExperience {
  return {
    experienceId: uuidv4(),
    agentId,
    timestamp: new Date().toISOString(),
    state,
    action,
    result,
    nextState,
    rewardSignal: options.rewardSignal,
    metadata: {
      priority: options.priority !== undefined ? options.priority : 0.5
    }
  };
}