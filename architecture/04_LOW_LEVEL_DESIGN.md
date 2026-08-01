# 04 — Low Level Design

Source of truth: `docs/09_BACKEND_ARCHITECTURE.md`, `docs/08_FRONTEND_ARCHITECTURE.md`

## Server — Package & Layered Design

```mermaid
classDiagram
    class Controller
    class Service
    class Repository
    class Model

    Controller --> Service : uses (constructor DI)
    Service --> Repository : uses (constructor DI)
    Repository --> Model : Mongoose ODM
    Controller ..> AppError : throws
    Service ..> AppError : throws
    Model : Mongoose Schema
```

### Request Lifecycle

```mermaid
flowchart LR
    A["helmet"] --> B["cors"]
    B --> C["morgan"]
    C --> D["rate-limit"]
    D --> E["cookie-parser"]
    E --> F["json body"]
    F --> G["mongo-sanitize"]
    G --> H["router + validators"]
    H --> I["controller"]
    I --> J["service"]
    J --> K["repository"]
    K --> L["model/Mongo"]
    I --> M["error handler"]
```

## Server — Module Design (examples)

### AuthService

```mermaid
classDiagram
    class AuthService {
        +register(dto) User
        +login(email, password) TokenPair
        +refresh(refreshToken) TokenPair
        +logout(userId) void
        +me(userId) User
    }
    class UserRepository {
        +findByEmail(email)
        +findById(id)
        +incrementRefreshVersion(id)
    }
    class TokenService {
        +signAccess(user) string
        +verifyAccess(token) payload
        +signRefresh(user) string
        +verifyRefresh(token) payload
    }
    AuthService --> UserRepository
    AuthService --> TokenService
```

### OcrService

```mermaid
classDiagram
    class OcrService {
        +processUpload(file) UploadResult
        +get(uploadId) Upload
        +commit(uploadId, correctedItems) CommitResult
        +retry(uploadId) UploadResult
        +reject(uploadId, reason) void
    }
    class ImageEnhancer {
        +normalize(buffer) buffer
    }
    class OcrEngine {
        +recognize(buffer) text
    }
    class InvoiceParser {
        +parse(text) items[]
    }
    class OcrValidator {
        +validate(items) itemsWithErrors[]
    }
    OcrService --> ImageEnhancer
    OcrService --> OcrEngine
    OcrService --> InvoiceParser
    OcrService --> OcrValidator
    OcrService --> InvoiceUploadRepository
```

### AiService

```mermaid
classDiagram
    class AiService {
        +runDailyAnalysis() Report
        +forecast(productId) Forecast
        +expiryRisk(batchId) Risk
        +healthScore() number
    }
    class Forecasting {
        +movingAverage(series, window) number[]
        +expSmoothing(series, alpha) number[]
        +seasonalIndex(series) number[]
    }
    class ExpiryEngine
    class RecommendationEngine
    class GeminiClient
    AiService --> Forecasting
    AiService --> ExpiryEngine
    AiService --> RecommendationEngine
    AiService --> GeminiClient
```

## Client — Key Module Design

```mermaid
classDiagram
    class ApiClient {
        +baseURL
        +request(config) Promise
        +refreshSingleFlight() Promise
    }
    class AuthContext {
        +user
        +login(credentials)
        +logout()
        +can(role) boolean
    }
    class useInventory {
        +data
        +loading
        +refetch()
    }
    ApiClient --> AuthContext : 401 handling
    useInventory --> ApiClient
```

## Data Contracts (key DTOs)

### TokenPair
```json
{ "accessToken": "jwt", "expiresIn": 900, "user": { "id": "...", "role": "manager" } }
```

### CommitResult
```json
{ "committed": 12, "productsCreated": 4, "batchesCreated": 12, "skippedDuplicates": 1 }
```

### Forecast
```json
{ "productId": "...", "horizonDays": 14, "daily": [12, 11, 13, ...], "total": 178, "confidence": "medium" }
```
