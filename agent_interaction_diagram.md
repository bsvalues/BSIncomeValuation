# Agent System Interaction Diagram

The following diagram illustrates how the components of the Multi-Agent System interact with each other:

```mermaid
graph TB
    Client[Client API Request]
    API[API Layer]
    MCP[Master Control Program]
    Core[Core Orchestrator]
    ValAgent[Valuation Agent]
    DataAgent[Data Cleaner Agent]
    RepAgent[Reporting Agent]
    ReplayBuffer[Replay Buffer]
    DB[(Database)]
    
    Client -->|1. Request| API
    API -->|2. Process Request| MCP
    MCP -->|3. Find Capable Agent| MCP
    MCP -->|4. Route Message| ValAgent
    MCP -->|4. Route Message| DataAgent
    MCP -->|4. Route Message| RepAgent
    ValAgent -->|5. Process Request| ValAgent
    ValAgent -->|6. DB Operations| DB
    ValAgent -->|7. Request Data Cleaning| MCP
    MCP -->|8. Route Cleaning Request| DataAgent
    DataAgent -->|9. Clean Data| DataAgent
    DataAgent -->|10. Return Cleaned Data| MCP
    MCP -->|11. Route Cleaned Data| ValAgent
    ValAgent -->|12. Complete Valuation| ValAgent
    ValAgent -->|13. Return Result| MCP
    MCP -->|14. Store Experience| ReplayBuffer
    MCP -->|15. Return Result| API
    API -->|16. Response| Client
    Core -->|System Monitoring| MCP
    Core -->|Agent Registration| MCP
    Core -->|Health Checks| ValAgent
    Core -->|Health Checks| DataAgent
    Core -->|Health Checks| RepAgent
    
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef system fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef agent fill:#bfb,stroke:#3a3,stroke-width:2px;
    classDef storage fill:#ffb,stroke:#aa3,stroke-width:2px;
    
    class Client client;
    class API,MCP,Core system;
    class ValAgent,DataAgent,RepAgent agent;
    class ReplayBuffer,DB storage;
```

## Message Flow Sequence

1. Client sends a request to the API layer (e.g., property valuation)
2. API layer processes request and forwards to MCP
3. MCP identifies which agent has the required capability
4. MCP routes the message to the appropriate agent (e.g., Valuation Agent)
5. Valuation Agent processes the request
6. If needed, Valuation Agent performs database operations
7. Valuation Agent may need data cleaning and sends a request
8. MCP routes the cleaning request to the Data Cleaner Agent
9. Data Cleaner Agent processes and cleans the data
10. Data Cleaner Agent returns the cleaned data to MCP
11. MCP routes the cleaned data back to the Valuation Agent
12. Valuation Agent completes the valuation with cleaned data
13. Valuation Agent returns the result to MCP
14. MCP stores the interaction experience in the Replay Buffer
15. MCP returns the final result to the API layer
16. API layer formats and sends the response to the Client

Throughout this process, the Core Orchestrator monitors the system, handles agent registration, and performs health checks to ensure everything is functioning properly.

## Event-Based Communication

In addition to the request-response pattern shown above, the system also uses event-based communication:

- Agents can broadcast messages to all other agents
- Status updates are sent regularly to maintain system awareness
- Error events trigger appropriate handling and recovery mechanisms
- Training events prompt agents to learn from the Replay Buffer