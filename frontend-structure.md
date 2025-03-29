```mermaid
graph TD
    App[App.tsx] --> Router[React Router]
    
    Router --> Home[Home.tsx]
    Router --> Farms[Farms.tsx]
    Router --> Staking[Staking.tsx]
    Router --> Swap[Swap.tsx]
    Router --> AIAssistant[AIAssistant.tsx]
    Router --> NotFound[NotFound.tsx]
    
    subgraph "Hooks"
        Web3[useWeb3.ts]
        Contracts[useContracts.ts]
    end
    
    subgraph "Components"
        Header[Header.tsx]
        Footer[Footer.tsx]
        FarmCard[FarmCard.tsx]
    end
    
    App --> Header
    App --> Footer
    Farms --> FarmCard
    
    App --> Web3
    App --> Contracts
    FarmCard --> Contracts
    
    subgraph "Types"
        TypeDefs[index.ts]
    end
    
    Web3 --> TypeDefs
    Contracts --> TypeDefs
    FarmCard --> TypeDefs
    
    subgraph "External Services"
        Ethereum[Ethereum Provider]
        ContractService[Smart Contracts]
    end
    
    Web3 --> Ethereum
    Contracts --> ContractService
    
    classDef page fill:#f9d5e5,stroke:#333,stroke-width:1px;
    classDef component fill:#d5e8f9,stroke:#333,stroke-width:1px;
    classDef hook fill:#e5f9d5,stroke:#333,stroke-width:1px;
    classDef external fill:#f5f5f5,stroke:#333,stroke-width:1px;
    
    class Home,Farms,Staking,Swap,AIAssistant,NotFound page;
    class Header,Footer,FarmCard component;
    class Web3,Contracts hook;
    class Ethereum,ContractService external;
```

You can view this diagram by copying the code and pasting it into https://mermaid.live

# Frontend Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Components
    participant Hooks
    participant API
    participant Blockchain
    
    User->>Components: Interact with UI
    Components->>Hooks: Call hooks methods
    Hooks->>API: Make API calls
    API->>Blockchain: Send transaction
    Blockchain->>API: Return result
    API->>Hooks: Update state
    Hooks->>Components: Re-render with new data
    Components->>User: Display updated UI
    
    Note over Components,Hooks: State Management
    Note over API,Blockchain: Web3 Integration
```

# Component Structure

```mermaid
classDiagram
    class App {
        +factoryContract
        +farmContract
        +isConnected
        +render()
    }
    
    class Pages {
        +Home
        +Farms
        +Staking
        +Swap
        +AIAssistant
        +NotFound
    }
    
    class Hooks {
        +useWeb3()
        +useContracts()
    }
    
    class Components {
        +Header
        +Footer
        +FarmCard
    }
    
    class Types {
        +PoolInfo
        +UserInfo
        +TokenInfo
        +FarmData
    }
    
    App --> Pages
    App --> Components
    App --> Hooks
    Pages --> Components
    Hooks --> Types
    Components --> Types
```

These diagrams illustrate the structure and data flow of the AIHarvest frontend application. 