# Business flow (proposed, needs team approval)

Every number marked placeholder is a business decision for the team, not a technical fact.

## 1. Customer request

1. The customer describes the need in text. AI extracts `items[]` (a request can contain several products, for example dress + trousers + shoes), budget, deadline, city.
2. The customer confirms or edits the items. A fabric suggested by the AI has `material_confirmed = false` and does not filter providers until the customer confirms it.
3. Backend matching applies hard constraints per item (category, MOQ, capacity, deadline, availability, confirmed material), then ranks. A provider must support every item. For mixed requests the UI should offer to split them into separate projects.
4. The customer sends the project to one or more providers (`project_requests`, status `pending`).

## 2. Provider decision

MVP (Months 1-3, roadmap Must-Have): the provider accepts or rejects. Accepting sets the project to `in_progress`, expires the other pending requests, and the first accepted request wins.

Deferred (Month 5, only if the MVP is stable): structured negotiation on the platform, not in chat. The provider sends an offer (unit price, quantity, material, lead time, deposit percent per item), the customer accepts, rejects or counters, up to 3 rounds (placeholder). Accepting an offer creates the order. This is human negotiation through a form; the roadmap exclusion "AI negotiation" is not affected. Provider pricing in the database is a range, the offer is the concrete figure. If the AI fabric suggestion is not trusted, the provider's offer is where the real material is stated.

## 3. Order statuses after approval (deferred)

```text
awaiting_deposit -> in_production -> pending_customer_approval -> shipped -> delivered -> completed
```

Also `disputed` and `cancelled`. Transitions are enforced by a database trigger. Production cannot start until the deposit is paid. Shipping needs a delivery address.

## 4. Checks during production

Per-stage checking is optional and depends on the order size:

| Order | Checks |
|---|---|
| Small (1 to 49 pieces, placeholder) | Provider updates progress; customer approves once at the end (`pending_customer_approval`) before shipping |
| Bulk (50 or more pieces, placeholder) | Customer must approve the `sample` stage before full production, and approves the final result before shipping |

Stages: `materials_sourcing`, `sample`, `production`, `finishing`, `quality_check`, `packing`. Only stages with `requires_customer_approval = true` wait for the customer. Photos are attached through `order_media`.

## 5. Deposit

Customized goods cannot be resold, so a deposit protects the provider's materials. Default `deposit_percent = 30` (placeholder), set per offer; 0 is allowed. Payments are simulated only (`is_simulated = true`); real gateways are excluded by the roadmap.

## 6. Unsatisfactory delivery (proposed policy)

- The customer can open an issue after delivery within 7 days (placeholder) or during final approval. The order becomes `disputed`.
- Issue types: `defect`, `not_as_agreed`, `late_delivery`, `damaged_in_delivery`, `other`, with photo evidence.
- Outcomes decided by the admin: `rework_agreed` (default when the work does not match the agreement), `refund_agreed`, `rejected`, `closed`.
- A change of mind or a size mistake made by the customer is not a defect.
- This policy needs legal and business review before it is shown to users.

## 7. One piece or a thousand

The same flow serves both. The difference is the stage checks above, the deposit percent, and provider capacity/MOQ, which matching already uses. The platform is the intermediary: it records the agreement, the payments and the issues; it does not manufacture.

## 8. Reviews

A customer can review a provider only if they have an accepted request with that provider (one review per provider). When the order workflow exists, the rule becomes: after the order is `completed`.

## 9. Notifications (basic, Sprint 4)

Request received, accepted or rejected, new message, project status change. Stored in `notifications` with a `type` and a `payload`.
