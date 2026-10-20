# Database ERD (Sprint 1)

Source of truth: `backend/db/migrations/001` to `004`. The deferred order workflow (`backend/db/deferred/005_order_workflow.sql`) is not drawn here.

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
  projects ||--|{ project_items : contains
  categories ||--o{ project_items : classifies
  materials ||--o{ project_items : "made of"
  materials ||--o{ provider_materials : "used by"
  providers ||--o{ provider_materials : works_with
  users ||--o{ notifications : receives
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
    text title
    numeric budget_min
    numeric budget_max
    date deadline
    text status
  }
  project_items {
    uuid id PK
    uuid project_id FK
    uuid category_id FK
    int quantity
    text item_name
    uuid material_id FK
    boolean material_confirmed
    text material_notes
    text color
    text style
    text size_details
    text customization
    jsonb extra
  }
  materials {
    uuid id PK
    text name UK
    text slug UK
  }
  provider_materials {
    uuid provider_id PK
    uuid material_id PK
  }
  notifications {
    uuid id PK
    uuid user_id FK
    text type
    jsonb payload
    timestamptz read_at
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
- A project outside `draft` must have at least one row in `project_items` (trigger).
- `project_items.material_confirmed = true` requires a `material_id`.
- Only one `accepted` request per project (partial unique index).
- `conversations (project_id, customer_id)` is a composite foreign key to `projects`, so the conversation customer always owns the project. A trigger checks that a message sender is the conversation customer or the provider's user.
- Row Level Security is enabled on every table with no policies: only the Express backend (service role) can read or write data.
