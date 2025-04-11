# Multi-Agent System Architecture

The Multi-Agent System is an intelligent orchestration layer that powers the Benton County Property Valuation System. This architecture enables communication, coordination, and collaboration between specialized AI agents, enhancing the platform's capabilities for data analysis, property valuation, and report generation.

## System Components

### 1. Master Control Program (MCP)

The Master Control Program is the central coordination component that manages message routing, agent registration, and system-wide monitoring. It ensures that all agents can communicate efficiently and that messages are properly delivered.

Features:
- Agent registration and discovery
- Message routing and delivery
- Capability-based agent selection
- Experience collection via Replay Buffer
- Health monitoring and metrics collection

### 2. Core Orchestrator

The Core serves as the high-level orchestrator for the entire system. It provides:
- System initialization and configuration
- Master prompt management and distribution
- Agent registration with the MCP
- System-wide event handling
- Health check coordination

### 3. Specialized Agents

#### Valuation Agent
Specialized in calculating property values based on income data and market conditions:
- Income stream analysis
- Capitalization rate adjustment
- Value projection with confidence scores
- Market trend incorporation

#### Data Cleaner Agent
Focused on data quality and preprocessing:
- Anomaly detection in data inputs
- Standardization of formats
- Missing value handling
- Outlier identification and cleaning

#### Reporting Agent
Generates insights and reports based on valuation data:
- Summary report generation
- Chart and visualization creation
- Trend analysis and projection
- Natural language insights

## Communication Protocol

Agents communicate through a standardized message protocol defined in `shared/agentProtocol.ts`. Each message includes:
- Unique message and correlation IDs
- Source and target agent identifiers
- Event type (e.g., STATUS_UPDATE, COMMAND, ERROR)
- Payload with event-specific data
- Timestamp

## API Endpoints

The system exposes several API endpoints for interaction:

### Status and Monitoring
- `GET /api/mcp/status` - Get the current status of the MCP and all agents
- `GET /api/mcp/agents/:agentId/metrics` - Get metrics for a specific agent
- `GET /api/mcp/agents/type/:agentType` - Get all agents of a specific type

### Agent Interaction
- `POST /api/mcp/process/:agentType` - Process a request through a specific agent type
- `POST /api/mcp/command/:agentType` - Send a command to agents of a specific type
- `POST /api/mcp/train` - Trigger training for all agents

### Experience Management
- `GET /api/mcp/experiences` - Get experiences from the replay buffer

## Continuous Learning

The system employs a Replay Buffer to store and retrieve agent experiences. This enables:
- Learning from past interactions
- Improvement of agent capabilities over time
- Analysis of system performance
- Training of new agents based on historical data

## System Integration

The Multi-Agent System is integrated with the rest of the application through:
- Server initialization in `server/index.ts`
- API routes in `server/mcpRoutes.ts`
- Controller functions in `server/mcpController.ts`

## Future Enhancements

Planned enhancements to the Multi-Agent System include:
- Expanded agent capabilities
- More sophisticated learning algorithms
- Enhanced collaboration between agents
- Natural language interface improvements
- Additional specialized agents for specific tasks