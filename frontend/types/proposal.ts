// Proposal system types — Anubis Phase 2
// Option C readiness: provider interfaces and placeholder stubs included at bottom

// ─────────────────────────────────────────────
// Enums / union types
// ─────────────────────────────────────────────

export type ProposalStatus =
  | 'draft'
  | 'ready'
  | 'sent'
  | 'approved'
  | 'declined'
  | 'expired'

export type ProposalTemplateStyle = 'modern' | 'classic' | 'premium'

export type BOMItemCategory =
  | 'material'
  | 'equipment'
  | 'labor'
  | 'subcontractor'
  | 'permit'
  | 'design'
  | 'travel'
  | 'fee'
  | 'allowance'
  | 'other'

export type BOMItemMarkupType = 'percent' | 'fixed' | 'none'

export type BOMItemSource =
  | 'manual'
  | 'ai_generated'
  | 'catalog'
  | 'document_extract'
  | 'vendor_quote'

export type BOMItemConfidence = 'high' | 'medium' | 'low' | 'unknown'

export type ProposalDocumentFileType =
  | 'proposal'
  | 'drawing'
  | 'photo'
  | 'contract'
  | 'invoice'
  | 'bom'
  | 'other'

export type ProposalDocumentStatus =
  | 'uploaded'
  | 'reviewed'
  | 'linked'
  | 'final'

export type AIProposalAction =
  | 'generate_scope'
  | 'rewrite_scope'
  | 'identify_missing'
  | 'generate_bom'
  | 'generate_assumptions'
  | 'generate_exclusions'
  | 'generate_email'
  | 'generate_sms'
  | 'generate_summary'
  | 'client_friendly_version'
  | 'more_detailed_version'
  | 'short_version'
  | 'formal_version'
  | 'compare_proposals'       // placeholder — Option C
  | 'extract_scope_from_doc'  // placeholder — Option C
  | 'extract_pricing_from_doc' // placeholder — Option C

// ─────────────────────────────────────────────
// Proposal
// ─────────────────────────────────────────────

export interface Proposal {
  id: string
  jobId?: string
  proposalNumber: string
  title: string
  serviceType: string
  milestone: string
  status: ProposalStatus
  templateStyle: ProposalTemplateStyle
  estimatedStartDate: string
  dueDate: string
  // Scope
  scopeOfWork: string
  includedWork: string[]
  assumptions: string[]
  exclusions: string[]
  clientResponsibilities: string[]
  internalNotes: string
  // Pricing (computed by pricingService, stored on proposal)
  subtotal: number
  taxableSubtotal: number
  taxEnabled: boolean
  taxRate: number
  taxAmount: number
  discountAmount: number
  total: number
  // Timestamps
  createdAt: string
  updatedAt: string
  previewGeneratedAt?: string
  sentAt?: string
  approvedAt?: string
}

// ─────────────────────────────────────────────
// BOM Item
// ─────────────────────────────────────────────

export interface BOMItem {
  id: string
  proposalId?: string
  jobId?: string
  itemName: string
  description: string
  category: BOMItemCategory
  roomOrArea: string
  phase: string
  vendor: string
  model: string
  sku: string
  quantity: number
  unit: string
  unitCost: number
  markupType: BOMItemMarkupType
  markupValue: number
  taxable: boolean
  optional: boolean
  included: boolean
  // Computed — recalculated on every edit
  subtotal: number
  markupAmount: number
  total: number
  source: BOMItemSource
  sourceDocumentId?: string
  confidence: BOMItemConfidence
  notes: string
  internalNotes: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// Pricing (computed snapshot)
// ─────────────────────────────────────────────

export interface PricingSnapshot {
  byCategory: Record<BOMItemCategory, number>
  subtotal: number
  taxableSubtotal: number
  taxAmount: number
  discountAmount: number
  total: number
}

// ─────────────────────────────────────────────
// Proposal Document
// ─────────────────────────────────────────────

export interface ProposalDocument {
  id: string
  jobId?: string
  proposalId?: string
  fileName: string
  fileType: ProposalDocumentFileType
  fileUrl: string
  status: ProposalDocumentStatus
  uploadedAt: string
  linkedToProposal: boolean
  aiSummary?: string
  extractedScope?: string   // placeholder — Option C
  extractedPricing?: string // placeholder — Option C
}

// ─────────────────────────────────────────────
// AI Result
// ─────────────────────────────────────────────

export interface ProposalAIResult {
  id: string
  proposalId?: string
  jobId?: string
  action: AIProposalAction
  promptUsed: string
  output: string
  structuredOutput?: unknown
  createdAt: string
  source: string
  confidence: BOMItemConfidence
}

// ─────────────────────────────────────────────
// Settings — Contractor Proposal Settings
// ─────────────────────────────────────────────

export interface PaymentTerm {
  id: string
  label: string
  percentage: number
  description: string
  dueTrigger: string
}

export interface BusinessProfile {
  companyName: string
  contactName: string
  email: string
  phone: string
  website: string
  businessAddress: string
  licenseNumber: string
  insuranceInfo: string
  logoUrl: string
}

export interface ProposalBranding {
  templateStyle: ProposalTemplateStyle
  primaryColor: string
  accentColor: string
  headerStyle: string
  footerStyle: string
}

export interface TaxSettings {
  defaultState: string
  defaultTaxRate: number
  taxEnabled: boolean
}

export interface DefaultTextBlocks {
  warrantyLanguage: string
  changeOrderLanguage: string
  pricingDisclaimer: string
  expirationLanguage: string
  assumptions: string
  exclusions: string
  clientSuppliedMaterials: string
  patchPaintRepair: string
}

export interface AIPromptSettings {
  generateScopeFromJobInfo: string
  rewriteScopeProfessionally: string
  identifyMissingDetails: string
  generateBOMFromScope: string
  generateAssumptions: string
  generateExclusions: string
  generateEmail: string
  generateSMS: string
  generateProposalSummary: string
  createClientFriendlyVersion: string
  createMoreDetailedVersion: string
  createShortVersion: string
  createFormalVersion: string
  compareUploadedProposals: string
  extractScopeFromDocument: string
  extractPricingFromDocument: string
}

export interface ContractorProposalSettings {
  businessProfile: BusinessProfile
  branding: ProposalBranding
  paymentTerms: PaymentTerm[]
  taxSettings: TaxSettings
  defaultTextBlocks: DefaultTextBlocks
  aiPromptSettings: AIPromptSettings
}

// ─────────────────────────────────────────────
// Option C placeholder stubs
// ─────────────────────────────────────────────

// TODO (Option C): Implement proposal versioning
export interface ProposalVersion {
  id: string
  proposalId: string
  versionNumber: number
  snapshot: Proposal
  createdAt: string
}

// TODO (Option C): Implement change orders as a separate feature
export interface ChangeOrder {
  id: string
  proposalId: string
  // fields TBD in Option C
}

// TODO (Option C): Implement reusable proposal templates
export interface ProposalTemplate {
  id: string
  style: ProposalTemplateStyle
  name: string
  // fields TBD in Option C
}

// ─────────────────────────────────────────────
// Provider interfaces (Option C swappability)
// ─────────────────────────────────────────────

export interface AIProvider {
  generate(
    action: AIProposalAction,
    prompt: string,
    context: Record<string, unknown>
  ): Promise<string>
}

export interface PdfProvider {
  generatePdf(proposalId: string, data: Proposal): Promise<Blob | null>
}

export interface DocumentExtractionProvider {
  extractText(fileUrl: string): Promise<string>
  extractScope(fileUrl: string): Promise<string>
  extractPricing(fileUrl: string): Promise<string>
}
