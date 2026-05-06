import type {
  ContractorProposalSettings,
  PaymentTerm,
  BusinessProfile,
  ProposalBranding,
  TaxSettings,
  DefaultTextBlocks,
  AIPromptSettings,
} from '@/types/proposal'
import { DEFAULT_PROMPTS } from './aiProposalService'

export const DEFAULT_PAYMENT_TERMS: PaymentTerm[] = [
  {
    id: '1',
    label: 'Deposit',
    percentage: 30,
    description: 'Required before work begins',
    dueTrigger: 'Before work begins',
  },
  {
    id: '2',
    label: 'Midpoint',
    percentage: 40,
    description: 'Due at project midpoint',
    dueTrigger: 'At project midpoint',
  },
  {
    id: '3',
    label: 'Final',
    percentage: 30,
    description: 'Due upon completion',
    dueTrigger: 'Upon completion',
  },
]

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  businessAddress: '',
  licenseNumber: '',
  insuranceInfo: '',
  logoUrl: '',
}

export const DEFAULT_BRANDING: ProposalBranding = {
  templateStyle: 'modern',
  primaryColor: '#0052FF',
  accentColor: '#4D7CFF',
  headerStyle: 'standard',
  footerStyle: 'standard',
}

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  defaultState: '',
  defaultTaxRate: 0,
  taxEnabled: false,
}

export const DEFAULT_TEXT_BLOCKS: DefaultTextBlocks = {
  warrantyLanguage:
    'All workmanship is warranted for one (1) year from the date of completion. Manufacturer warranties apply to all materials used.',
  changeOrderLanguage:
    'Any changes to the scope of work must be agreed upon in writing before additional work commences. Change orders may affect the final project price and schedule.',
  pricingDisclaimer:
    'This proposal is valid for 30 days from the date issued. Prices are subject to change based on material availability and market conditions.',
  expirationLanguage:
    'This proposal expires 30 days from the date issued. Please contact us to renew if additional time is needed.',
  assumptions:
    'Work will be performed during normal business hours. Site will be accessible and clear of obstructions.',
  exclusions:
    'Any work not explicitly listed in the scope of work is excluded from this proposal.',
  clientSuppliedMaterials:
    'Client-supplied materials are not covered under our workmanship warranty. Contractor is not responsible for defects in client-supplied materials.',
  patchPaintRepair:
    'Minor patching, touch-up painting, and surface repairs in the immediate work area are included. Full-room or whole-house painting/repairs are not included.',
}

export const DEFAULT_AI_PROMPT_SETTINGS: AIPromptSettings = {
  generateScopeFromJobInfo: DEFAULT_PROMPTS.generate_scope,
  rewriteScopeProfessionally: DEFAULT_PROMPTS.rewrite_scope,
  identifyMissingDetails: DEFAULT_PROMPTS.identify_missing,
  generateBOMFromScope: DEFAULT_PROMPTS.generate_bom,
  generateAssumptions: DEFAULT_PROMPTS.generate_assumptions,
  generateExclusions: DEFAULT_PROMPTS.generate_exclusions,
  generateEmail: DEFAULT_PROMPTS.generate_email,
  generateSMS: DEFAULT_PROMPTS.generate_sms,
  generateProposalSummary: DEFAULT_PROMPTS.generate_summary,
  createClientFriendlyVersion: DEFAULT_PROMPTS.client_friendly_version,
  createMoreDetailedVersion: DEFAULT_PROMPTS.more_detailed_version,
  createShortVersion: DEFAULT_PROMPTS.short_version,
  createFormalVersion: DEFAULT_PROMPTS.formal_version,
  compareUploadedProposals: DEFAULT_PROMPTS.compare_proposals,
  extractScopeFromDocument: DEFAULT_PROMPTS.extract_scope_from_doc,
  extractPricingFromDocument: DEFAULT_PROMPTS.extract_pricing_from_doc,
}

export const DEFAULT_PROPOSAL_SETTINGS: ContractorProposalSettings = {
  businessProfile: DEFAULT_BUSINESS_PROFILE,
  branding: DEFAULT_BRANDING,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
  taxSettings: DEFAULT_TAX_SETTINGS,
  defaultTextBlocks: DEFAULT_TEXT_BLOCKS,
  aiPromptSettings: DEFAULT_AI_PROMPT_SETTINGS,
}

export function mergeProposalSettings(
  stored?: Partial<ContractorProposalSettings>
): ContractorProposalSettings {
  if (!stored) return DEFAULT_PROPOSAL_SETTINGS
  return {
    businessProfile: { ...DEFAULT_BUSINESS_PROFILE, ...(stored.businessProfile ?? {}) },
    branding: { ...DEFAULT_BRANDING, ...(stored.branding ?? {}) },
    paymentTerms:
      stored.paymentTerms && stored.paymentTerms.length > 0
        ? stored.paymentTerms
        : DEFAULT_PAYMENT_TERMS,
    taxSettings: { ...DEFAULT_TAX_SETTINGS, ...(stored.taxSettings ?? {}) },
    defaultTextBlocks: { ...DEFAULT_TEXT_BLOCKS, ...(stored.defaultTextBlocks ?? {}) },
    aiPromptSettings: { ...DEFAULT_AI_PROMPT_SETTINGS, ...(stored.aiPromptSettings ?? {}) },
  }
}
