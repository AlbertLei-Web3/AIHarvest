# AI Harvest Project Structure

## Architecture Flow Diagram

```mermaid
graph TD
    subgraph "Frontend"
        UI[React UI] --> |Uses| Hooks[Hooks]
        UI --> |Renders| Pages[Page Components]
        Pages --> |Uses| Components[UI Components]
        Hooks --> |Calls| Contracts[Contract Interfaces]
        Contracts --> |Connects to| Provider[Web3 Provider]
    end

    subgraph "Smart Contracts"
        Provider --> |Interacts with| Factory[Factory Contract]
        Factory --> |Creates| Farm[Farm Contract]
        Farm --> |Uses| Token[Token Contract]
    end

    subgraph "Assets"
        UI --> |Loads| Assets[Static Assets]
    end
```

## Directory Structure

```mermaid
graph TD
    Root[AI Harvest] --> Frontend[frontend-react]
    Root --> Contracts[aiharvest]
    Root --> Docs[Documentation]

    Frontend --> FE_Public[public]
    Frontend --> FE_Src[src]
    
    FE_Src --> FE_Components[components]
    FE_Src --> FE_Pages[pages]
    FE_Src --> FE_Hooks[hooks]
    FE_Src --> FE_Types[types]
    FE_Src --> FE_Assets[assets]
    
    FE_Components --> Layout[Layout Components]
    FE_Components --> UI[UI Components]
    FE_Components --> Modals[Modal Components]
    
    FE_Pages --> Home[Home.tsx]
    FE_Pages --> Farms[Farms.tsx]
    FE_Pages --> Staking[Staking.tsx]
    FE_Pages --> Swap[Swap.tsx]
    FE_Pages --> AIAssistant[AIAssistant.tsx]
    FE_Pages --> NotFound[NotFound.tsx]
    
    FE_Hooks --> Web3[useWeb3.ts]
    FE_Hooks --> Contracts[useContracts.ts]
    
    Contracts --> SC_Contracts[contracts]
    Contracts --> SC_Scripts[scripts]
    Contracts --> SC_Test[test]
    
    SC_Contracts --> Factory[Factory.sol]
    SC_Contracts --> Farm[Farm.sol]
    SC_Contracts --> Token[TestToken.sol]
    
    Docs --> Setup[SETUP.md]
    Docs --> Architecture[PROJECT_ARCHITECTURE.md]
    Docs --> Deployment[DEPLOYMENT.md]
    Docs --> Sepolia[SEPOLIA_DEPLOYMENT.md]
    Docs --> Improvements[IMPROVEMENTS.md]
```

## Contract Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Web3Provider
    participant Factory
    participant Farm
    
    User->>Frontend: Connect Wallet
    Frontend->>Web3Provider: Request Connection
    Web3Provider->>Frontend: Return Provider & Signer
    
    Frontend->>Factory: Load Factory Contract
    Factory->>Frontend: Return Farms List
    
    Frontend->>Farm: Load Farm Contract
    Farm->>Frontend: Return Farm Data
    
    User->>Frontend: Select Farm & Stake
    Frontend->>Farm: Approve Tokens
    Frontend->>Farm: Stake Tokens
    Farm->>Frontend: Confirm Transaction
    
    User->>Frontend: Request Rewards
    Frontend->>Farm: Get Pending Rewards
    Farm->>Frontend: Return Rewards Data
    
    User->>Frontend: Harvest Rewards
    Frontend->>Farm: Call Harvest Function
    Farm->>Frontend: Confirm Transaction
```

You can view these diagrams by copying the code and pasting it into https://mermaid.live 