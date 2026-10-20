const { z } = require('zod');

const PROVIDER_TYPES = ['designer', 'manufacturer'];
const uuid = z.string().uuid();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a time in HH:MM format');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20)
};

const idParams = z.object({ id: uuid });

const register = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(72),
    role: z.enum(['customer', 'provider']),
    provider_type: z.enum(PROVIDER_TYPES).optional(),
    terms: z.literal(true)
  })
  .superRefine((value, ctx) => {
    if (value.role === 'provider' && !value.provider_type) {
      ctx.addIssue({ code: 'custom', path: ['provider_type'], message: 'provider_type is required when role is provider' });
    }
    if (value.role === 'customer' && value.provider_type) {
      ctx.addIssue({ code: 'custom', path: ['provider_type'], message: 'provider_type is only allowed when role is provider' });
    }
  });

const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

const providerListQuery = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    category_id: uuid.optional(),
    provider_type: z.enum(PROVIDER_TYPES).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    quantity: z.coerce.number().int().min(1).optional(),
    max_price: z.coerce.number().min(0).optional(),
    min_rating: z.coerce.number().min(1).max(5).optional(),
    material_id: uuid.optional(),
    sort: z.enum(['rating', '-rating', 'price', '-price', 'name', '-name']).default('-rating'),
    ...pagination
  })
  .superRefine((value, ctx) => {
    if ((value.quantity !== undefined || value.max_price !== undefined) && !value.category_id) {
      ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'category_id is required when filtering by quantity or max_price' });
    }
  });

const providerCompareQuery = z.object({
  ids: z
    .string()
    .transform((value) => value.split(',').map((item) => item.trim()))
    .pipe(z.array(uuid).min(2).max(3)),
  project_id: uuid.optional()
});

const providerUpdate = z
  .object({
    business_name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(5000).nullable(),
    city: z.string().trim().max(100).nullable(),
    address: z.string().trim().max(300).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    requirements: z.string().trim().max(3000).nullable()
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const pricingParams = z.object({ category_id: uuid });

const pricingUpsert = z
  .object({
    min_quantity: z.number().int().min(1),
    max_quantity: z.number().int().min(1),
    min_price: z.number().min(0),
    max_price: z.number().min(0),
    price_unit: z.enum(['per_piece', 'per_order']).default('per_piece'),
    lead_time_days: z.number().int().min(0).nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (value.max_quantity < value.min_quantity) {
      ctx.addIssue({ code: 'custom', path: ['max_quantity'], message: 'max_quantity must be greater than or equal to min_quantity' });
    }
    if (value.max_price < value.min_price) {
      ctx.addIssue({ code: 'custom', path: ['max_price'], message: 'max_price must be greater than or equal to min_price' });
    }
  });

const workingHour = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    opens_at: time.nullable().optional(),
    closes_at: time.nullable().optional(),
    is_closed: z.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    if (!value.is_closed) {
      if (!value.opens_at || !value.closes_at) {
        ctx.addIssue({ code: 'custom', path: ['opens_at'], message: 'opens_at and closes_at are required when is_closed is false' });
      } else if (value.closes_at <= value.opens_at) {
        ctx.addIssue({ code: 'custom', path: ['closes_at'], message: 'closes_at must be later than opens_at' });
      }
    }
  });

const workingHoursReplace = z.object({ working_hours: z.array(workingHour).min(1).max(7) });

const availabilityEntry = z.object({
  date,
  status: z.enum(['available', 'limited', 'unavailable']),
  capacity: z.number().int().min(0).nullable().optional()
});

const availabilityReplace = z.object({ availability: z.array(availabilityEntry).min(1).max(366) });

const availabilityQuery = z.object({ from: date.optional(), to: date.optional() });

const reviewCreate = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional()
});

const projectItemInput = z
  .object({
    category_id: uuid,
    quantity: z.number().int().min(1),
    item_name: z.string().trim().max(200).nullable().optional(),
    material_id: uuid.nullable().optional(),
    material_confirmed: z.boolean().default(false),
    material_notes: z.string().trim().max(500).nullable().optional(),
    color: z.string().trim().max(100).nullable().optional(),
    style: z.string().trim().max(200).nullable().optional(),
    size_details: z.string().trim().max(500).nullable().optional(),
    customization: z.string().trim().max(1000).nullable().optional(),
    extra: z.record(z.string(), z.unknown()).optional()
  })
  .superRefine((value, ctx) => {
    if (value.material_confirmed && !value.material_id) {
      ctx.addIssue({ code: 'custom', path: ['material_id'], message: 'material_id is required when material_confirmed is true' });
    }
  });

const projectFields = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000).nullable().optional(),
  budget_min: z.number().min(0).nullable().optional(),
  budget_max: z.number().min(0).nullable().optional(),
  deadline: date.nullable().optional(),
  location_city: z.string().trim().max(100).nullable().optional()
});

function checkBudget(value, ctx) {
  if (value.budget_min != null && value.budget_max != null && value.budget_max < value.budget_min) {
    ctx.addIssue({ code: 'custom', path: ['budget_max'], message: 'budget_max must be greater than or equal to budget_min' });
  }
}

const projectCreate = projectFields
  .extend({ items: z.array(projectItemInput).max(20).optional() })
  .superRefine(checkBudget);

const projectUpdate = projectFields
  .partial()
  .superRefine(checkBudget)
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const projectItemsReplace = z.object({ items: z.array(projectItemInput).min(1).max(20) });

const projectListQuery = z.object({
  status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled']).optional(),
  ...pagination
});

const projectStatusUpdate = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled'])
});

const projectRequestCreate = z.object({
  provider_id: uuid,
  message: z.string().trim().max(1000).optional()
});

const projectRequestListQuery = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).optional(),
  project_id: uuid.optional(),
  ...pagination
});

const projectRequestStatusUpdate = z.object({
  status: z.enum(['accepted', 'rejected', 'withdrawn'])
});

const conversationCreate = z.object({ project_id: uuid, provider_id: uuid });

const messageListQuery = z.object({ ...pagination });

const messageCreate = z.object({ message: z.string().trim().min(1).max(4000) });

const providerMaterialsReplace = z.object({ material_ids: z.array(uuid).max(50) });

const notificationListQuery = z.object({
  unread: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  ...pagination
});

const quoteItem = z.object({
  project_item_id: uuid,
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  material_id: uuid.nullable().optional(),
  notes: z.string().trim().max(500).optional()
});

const quoteCreate = z.object({
  lead_time_days: z.number().int().min(0).max(730),
  deposit_percent: z.number().min(0).max(100).optional(),
  valid_until: z.string().datetime().optional(),
  note: z.string().trim().max(1000).optional(),
  items: z.array(quoteItem).min(1).max(20)
});

const quoteRespond = z.object({ status: z.enum(['accepted', 'rejected']) });

const orderListQuery = z.object({
  status: z.enum(['awaiting_deposit', 'in_production', 'pending_customer_approval', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled']).optional(),
  ...pagination
});

const orderDeliveryUpdate = z.object({
  delivery_address: z.string().trim().min(5).max(500),
  delivery_city: z.string().trim().min(2).max(100)
});

const orderStatusUpdate = z
  .object({
    status: z.enum(['in_production', 'pending_customer_approval', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled']),
    reason: z.string().trim().min(3).max(1000).optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'cancelled' && !value.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason is required when cancelling an order' });
    }
  });

const stageParams = z.object({ id: uuid, stage_id: uuid });

const stageUpdate = z.object({
  status: z.enum(['in_progress', 'completed', 'approved', 'changes_requested']),
  note: z.string().trim().max(1000).optional()
});

const paymentCreate = z.object({ kind: z.enum(['deposit', 'balance']) });

const issueCreate = z.object({
  type: z.enum(['defect', 'not_as_agreed', 'late_delivery', 'damaged_in_delivery', 'other']),
  description: z.string().trim().min(10).max(3000)
});

const issueResolve = z.object({
  status: z.enum(['in_review', 'rework_agreed', 'refund_agreed', 'rejected', 'closed']),
  resolution_note: z.string().trim().max(2000).optional()
});

const aiExtract = z.object({
  text: z.string().trim().min(5).max(4000),
  project_id: uuid.optional()
});

const aiGenerateDesign = z.object({
  project_id: uuid,
  prompt: z.string().trim().min(5).max(1000),
  reference_design_id: uuid.optional()
});

module.exports = {
  idParams,
  pagination,
  register,
  login,
  providerListQuery,
  providerCompareQuery,
  providerUpdate,
  pricingParams,
  pricingUpsert,
  workingHoursReplace,
  availabilityReplace,
  availabilityQuery,
  reviewCreate,
  projectItemInput,
  projectCreate,
  projectUpdate,
  projectItemsReplace,
  projectListQuery,
  projectStatusUpdate,
  projectRequestCreate,
  projectRequestListQuery,
  projectRequestStatusUpdate,
  conversationCreate,
  messageListQuery,
  messageCreate,
  providerMaterialsReplace,
  notificationListQuery,
  quoteCreate,
  quoteRespond,
  orderListQuery,
  orderDeliveryUpdate,
  orderStatusUpdate,
  stageParams,
  stageUpdate,
  paymentCreate,
  issueCreate,
  issueResolve,
  aiExtract,
  aiGenerateDesign
};
