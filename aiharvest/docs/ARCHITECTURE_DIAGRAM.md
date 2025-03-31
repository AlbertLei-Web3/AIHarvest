# AI Harvest Architecture Diagrams

AI Harvest是一个基于智能合约的DeFi收益平台，集成了多种功能和可升级架构。

This file contains various diagrams visualizing the architecture of the AI Harvest platform.

## 合约依赖关系图 (Contract Dependency Diagram)

```mermaid
graph TD
    subgraph "依赖关系 (Dependencies)"
        TestTokenV1[TestTokenUpgradeable]
        TestTokenV2[TestTokenUpgradeableV2]
        FarmV1[FarmUpgradeable]
        FarmV2[FarmUpgradeableV2]
        FactoryV1[FactoryUpgradeable]
        FactoryV2[FactoryUpgradeableV2]
        SwapV1[SwapRouterUpgradeable]
        SwapV2[SwapRouterUpgradeableV2]
        IFarm[IFarmUpgradeable]
        
        TestTokenV2 -->|inherits| TestTokenV1
        FarmV2 -->|inherits| FarmV1
        FarmV1 -->|implements| IFarm
        FactoryV2 -->|inherits| FactoryV1
        FactoryV1 -->|creates| FarmV1
        SwapV2 -->|inherits| SwapV1
    end
```

## 升级流程图 (Upgrade Flow)

```mermaid
sequenceDiagram
    participant Owner
    participant FactoryProxy
    participant Factory_V1 as Factory Implementation V1
    participant Factory_V2 as Factory Implementation V2
    participant FarmProxy
    participant Farm_V1 as Farm Implementation V1
    participant Farm_V2 as Farm Implementation V2
    
    Owner->>FactoryProxy: upgradeToAndCall(Factory_V2)
    FactoryProxy->>Factory_V1: _authorizeUpgrade()
    Factory_V1->>FactoryProxy: Authorized
    FactoryProxy->>Factory_V2: Set implementation
    
    Owner->>Factory_V2: setFarmImplementation(Farm_V2)
    Factory_V2->>Factory_V2: Store new implementation
    
    Note over FarmProxy,Farm_V2: New Farms use V2 implementation
    
    Owner->>Factory_V2: createFarm(...)
    Factory_V2->>FarmProxy: Clone with Farm_V2 logic
    Farm_V2->>FarmProxy: initialize(...)
```

## 质押流程图 (Staking Flow)

```mermaid
sequenceDiagram
    actor User
    participant Token
    participant Farm
    participant Factory
    
    User->>Token: approve(farmAddress, amount)
    Token->>User: Success
    
    User->>Farm: deposit(amount)
    Farm->>Farm: updatePool()
    Farm->>Token: transferFrom(user, farm, amount)
    Farm->>Farm: Update userInfo
    Farm->>User: Success
    
    Note over User,Farm: Time passes...
    
    User->>Farm: withdraw(amount)
    Farm->>Farm: Check lock period
    Farm->>Farm: updatePool()
    Farm->>Farm: Calculate rewards
    Farm->>Token: transfer(user, rewards)
    Farm->>Token: transfer(user, amount)
    Farm->>User: Success
```

## 代币交换流程图 (Token Swap Flow)

```mermaid
sequenceDiagram
    actor User
    participant TokenA
    participant SwapRouter
    participant TokenB
    participant Treasury
    
    User->>TokenA: approve(routerAddress, amount)
    TokenA->>User: Success
    
    User->>SwapRouter: swap(tokenA, tokenB, amount)
    SwapRouter->>SwapRouter: Check whitelist (V2)
    SwapRouter->>SwapRouter: Check max amount (V2)
    SwapRouter->>SwapRouter: Calculate output amount
    
    SwapRouter->>TokenA: transferFrom(user, router, amount)
    SwapRouter->>TokenA: transferFrom(user, treasury, fee)
    SwapRouter->>TokenB: transfer(user, outputAmount)
    
    SwapRouter->>User: Success
```

## 部署流程图 (Deployment Flow)

```mermaid
graph TD
    Deploy[Deploy Script] -->|1. Deploy| TestToken[TestToken Proxy + Impl]
    Deploy -->|2. Deploy| Factory[Factory Proxy + Impl]
    Deploy -->|3. Deploy| FarmImpl[Farm Implementation]
    Deploy -->|4. Register in| Factory
    Deploy -->|5. Deploy| SwapRouter[SwapRouter Proxy + Impl]
    Factory -->|6. Create| Farm1[Farm 1 - AIH Staking]
    Factory -->|7. Create| Farm2[Farm 2 - USDC Staking]
    Deploy -->|8. Add liquidity| SwapRouter
    Deploy -->|9. Fund farms| Farm1
    Deploy -->|9. Fund farms| Farm2
```

## 合约状态流程图 (Contract State Flow)

```mermaid
stateDiagram-v2
    [*] --> Deployed
    Deployed --> Active: Initialize
    
    state Active {
        [*] --> Operational
        Operational --> Paused: pause()
        Paused --> Operational: unpause()
    }
    
    Active --> Upgraded: upgrade()
    Upgraded --> Active: New Version
    
    state Upgraded {
        [*] --> V2
        V2 --> V3: Future upgrade
    }
```

## 前端交互流程图 (Frontend Interaction Flow)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3
    participant Contracts
    
    User->>Frontend: Connect Wallet
    Frontend->>Web3: Request Connection
    Web3->>User: Request Approval
    User->>Web3: Approve Connection
    Web3->>Frontend: Connected
    
    Frontend->>Contracts: Read contract data
    Contracts->>Frontend: Return data
    Frontend->>User: Display UI
    
    User->>Frontend: Stake tokens
    Frontend->>Web3: Create transaction
    Web3->>User: Request signature
    User->>Web3: Sign transaction
    Web3->>Contracts: Send transaction
    Contracts->>Web3: Return receipt
    Web3->>Frontend: Update UI
    Frontend->>User: Show success
```

## 系统架构图 (System Architecture)

```mermaid
graph TD
    subgraph "前端 (Frontend)"
        UI[React UI]
        State[Zustand State]
        Web3[ethers.js]
    end
    
    subgraph "后端 (Backend)"
        API[GraphQL API]
        Cache[Redis Cache]
        DB[PostgreSQL]
    end
    
    subgraph "区块链 (Blockchain)"
        SC[Smart Contracts]
        Events[Contract Events]
        TheGraph[The Graph Indexer]
    end
    
    UI <-->|User Actions| State
    State <-->|Contract Calls| Web3
    Web3 <-->|JSON-RPC| SC
    SC -->|Emit| Events
    Events -->|Index| TheGraph
    TheGraph <-->|Query| API
    API <-->|Store/Read| DB
    API <-->|Cache| Cache
    API <-->|Data| State
``` 