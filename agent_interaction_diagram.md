# Agent Interaction Diagram and Message Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                     Client Applications                            │
│                                                                    │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         API Layer                                  │
│                                                                    │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│              Master Control Program (MCP)                          │
│                                                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │                 │    │                 │    │                 │ │
│  │  Agent Registry │    │  Replay Buffer  │    │ Learning Engine │ │
│  │                 │    │                 │    │                 │ │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘ │
│           │                      │                      │          │
└───────────┼──────────────────────┼──────────────────────┼──────────┘
            │                      │                      │
            ▼                      │                      ▼
┌───────────────────────┐          │          ┌─────────────────────────┐
│                       │          │          │                         │
│    Message Router     │◄─────────┘          │     Policy Updater      │
│                       │                     │                         │
└───────────┬───────────┘                     └───────────┬─────────────┘
            │                                             │
            │                                             │
            ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                               Agent Army                                │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐│
│  │             │    │             │    │             │    │            ││
│  │ValuationAgent    │DataCleanAgent    │ReportingAgent    │  Future    ││
│  │             │    │             │    │             │    │  Agents    ││
│  └─────────────┘    └─────────────┘    └─────────────┘    └────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Message Flow Examples

### 1. Standard Request Processing

```
Client Request
      │
      ▼
API Endpoint
      │
      ▼
MCP Controller
      │
      ▼
Agent Registry (finds appropriate agent)
      │
      ▼
Selected Agent (processes request)
      │
      ▼
Agent sends result message to MCP
      │
      ▼
Message stored in Replay Buffer
      │
      ▼
Result returned to client
```

### 2. Agent Help Request Flow

```
Agent encounters difficulty
      │
      ▼
Agent sends REQUEST_HELP message to MCP
      │
      ▼
MCP stores request in Replay Buffer
      │
      ▼
MCP identifies helper agent based on capabilities
      │
      ▼
MCP forwards request to helper agent
      │
      ▼
Helper agent processes request
      │
      ▼
Helper sends assistance result to MCP
      │
      ▼
MCP forwards assistance to original agent
      │
      ▼
Original agent completes task with assistance
```

### 3. Learning Cycle

```
Replay Buffer reaches threshold size
      │
      ▼
MCP triggers learning cycle
      │
      ▼
Learning Engine samples experiences
      │
      ▼
Learning Engine computes policy updates
      │
      ▼
Policy Updater distributes updates to agents
      │
      ▼
Agents update internal parameters
```

## Sample JSON Messages

### Action Message (ValuationAgent analyzing income)

```json
{
  "agentId": "valuation-agent-1",
  "agentType": "valuation",
  "timestamp": "2025-04-11T20:15:32.123Z",
  "eventType": "action",
  "payload": {
    "action": "analyze_income",
    "parameters": {
      "userId": 1,
      "incomeIds": [24, 25, 26]
    },
    "reason": "User requested income analysis via dashboard",
    "expectedOutcome": "Income analysis with valuation suggestion"
  }
}
```

### Result Message (ValuationAgent returning analysis)

```json
{
  "agentId": "valuation-agent-1",
  "agentType": "valuation",
  "timestamp": "2025-04-11T20:15:33.456Z",
  "eventType": "result",
  "payload": {
    "success": true,
    "data": {
      "analysis": {
        "findings": [
          "Total monthly income is $4,500.00",
          "Primary income source is rental (75% of total)",
          "Income diversification score is 65.0 out of 100",
          "Income stability score is 82.5 out of 100"
        ],
        "distribution": [
          {"source": "rental", "percentage": 75.0},
          {"source": "business", "percentage": 25.0}
        ],
        "recommendations": [
          "Consider diversifying income sources"
        ]
      },
      "suggestedValuation": {
        "amount": "243000.00",
        "multiplier": "4.5",
        "confidenceScore": 85
      }
    },
    "processingTimeMs": 1333,
    "notes": ["Analysis completed with high confidence"]
  },
  "metadata": {
    "processingTimeMs": 1333,
    "confidenceScore": 85
  }
}
```

### Error Message (DataCleanerAgent encountering problem)

```json
{
  "agentId": "data-cleaner-agent-1",
  "agentType": "data_cleaner",
  "timestamp": "2025-04-11T20:16:45.789Z",
  "eventType": "error",
  "payload": {
    "message": "Invalid data format in income records",
    "stack": "Error: Invalid data format in income records\n    at validateIncomeData...",
    "taskId": "data-quality-scan-123"
  }
}
```

### Help Request Message (ReportingAgent needs assistance)

```json
{
  "agentId": "reporting-agent-1",
  "agentType": "reporting",
  "timestamp": "2025-04-11T20:18:12.345Z",
  "eventType": "request_help",
  "payload": {
    "problemDescription": "Unable to generate insights due to insufficient valuation history",
    "taskId": "report-generation-456",
    "failedAttempts": 2,
    "lastError": "Error: Cannot calculate valuation growth with less than 2 data points",
    "contextData": {
      "userId": 1,
      "valuationCount": 1,
      "reportType": "quarterly"
    }
  }
}
```

## Agent Coordination Benefits

1. **Resource Optimization**: Agents focus on their specialized tasks while the MCP handles coordination, preventing duplication of effort.

2. **Intelligent Routing**: Requests are routed to the most suitable agent based on capability matching and current performance metrics.

3. **Continuous Improvement**: The system learns from every interaction, gradually improving performance without manual intervention.

4. **Fault Tolerance**: If an agent fails or performs poorly, the MCP can route future requests to better-performing agents and trigger retraining.

5. **Transparent Operations**: All agent activities are logged in the Replay Buffer, providing a comprehensive audit trail and learning dataset.

6. **Adaptive Behavior**: Agents can adjust their parameters and behavior based on feedback from the MCP and other agents.

7. **Scalable Architecture**: New agent types can be added without disrupting existing functionality, allowing the system to grow organically.