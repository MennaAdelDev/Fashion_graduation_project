# Database ERD (Sprint 1)

Source of truth: `backend/db/migrations/001_initial_schema.sql`.

```mermaid
erDiagram
  users ||--o| providers : "has profile"
  users ||--o{ projects : creates
  users ||--o{ reviews : writes
  users ||--o{ messages : sends
  providers ||--o{ reviews : receives
  providers ||--o{ provider_categories : supports
  categories ||--o{ provider_categories : "supported by"
  provider_categories ||--o| provider_pricing : "priced as"
  providers ||--o{ provider_working_hours : has
  providers ||--o{ availability : has
  providers ||--o{ portfolio : shows
  categories ||--o{ portfolio : tags
  categories ||--o{ projects : classifies
  projects ||--o| project_requirements : has
  projects ||--o{ project_requests : sent
  providers ||--o{ project_requests : receives
  projects ||--o{ project_designs : has
  projects ||--o{ matches : ranked
  providers ||--o{ matches : ranked
  projects ||--o{ conversations : has
  conversations ||--o{ messages : contains

  users {
    uuid id PK
    uuid auth_id UK
    text name
    text email UK
    text role
  }
  providers {
    uuid id PK
    uuid user_id UK
    text provider_type
    text business_name
    text description
    text city
    text requirements
    boolean verified
  }
  categories {
    uuid id PK
    text name UK
    text slug UK
  }
  provider_categories {
    uuid provider_id PK
    uuid category_id PK
  }
  provider_pricing {
    uuid id PK
    uuid provider_id FK
    uuid category_id FK
    int min_quantity
    int max_quantity
    numeric min_price
    numeric max_price
    int lead_time_days
  }
  provider_working_hours {
    uuid id PK
    uuid provider_id FK
    smallint day_of_week
    time opens_at
    time closes_at
    boolean is_closed
  }
  availability {
    uuid id PK
    uuid provider_id FK
    date date
    text status
    int capacity
  }
  portfolio {
    uuid id PK
    uuid provider_id FK
    uuid category_id FK
    text image_url
  }
  reviews {
    uuid id PK
    uuid provider_id FK
    uuid customer_id FK
    smallint rating
    text comment
  }
  projects {
    uuid id PK
    uuid customer_id FK
    uuid category_id FK
    text title
    int quantity
    numeric budget_min
    numeric budget_max
    date deadline
    text status
  }
  project_requirements {
    uuid project_id PK
    text item
    text fabric
    text color
    text style
    text size
    text customization
    jsonb extra
  }
  project_requests {
    uuid id PK
    uuid project_id FK
    uuid provider_id FK
    text status
  }
  project_designs {
    uuid id PK
    uuid project_id FK
    text source
    text image_url
    jsonb metadata
  }
  matches {
    uuid id PK
    uuid project_id FK
    uuid provider_id FK
    numeric score
    text reason
  }
  conversations {
    uuid id PK
    uuid project_id FK
    uuid customer_id FK
    uuid provider_id FK
  }
  messages {
    uuid id PK
    uuid conversation_id FK
    uuid sender_id FK
    text message
    timestamptz read_at
  }
```

View `provider_rating_stats` returns `provider_id`, `rating_avg` and `rating_count` per provider, computed from `reviews` (hidden reviews excluded).

Key constraints:

- `provider_pricing (provider_id, category_id)` references `provider_categories`, so a provider can only price a category it supports.
- `max_quantity >= min_quantity` and `max_price >= min_price`.
- One review per customer per provider.
- A project outside `draft` must have `category_id` and `quantity`.
- Row Level Security is enabled on every table with no policies: only the Express backend (service role) can read or write data.
