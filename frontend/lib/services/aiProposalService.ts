import { apiPost } from '@/lib/api'
import type {
  AIProposalAction,
  AIPromptSettings,
  ContractorProposalSettings,
  Proposal,
  BOMItem,
  ProposalAIResult,
} from '@/types/proposal'

// Default prompt templates — overridden by user's AI Prompt Settings in Contractor Settings
const DEFAULT_PROMPTS: Record<AIProposalAction, string> = {
  generate_scope:
    'Based on the job info provided, write a clear, professional scope of work for a contractor proposal.',
  rewrite_scope:
    'Rewrite the following scope of work to be more professional, clear, and client-friendly.',
  identify_missing:
    'Review the following scope of work and identify any missing details, unclear items, or potential issues.',
  generate_bom:
    'Based on the following scope of work, generate a bill of materials list with item names, categories, quantities, and estimated costs.',
  generate_assumptions:
    'Based on the scope of work, generate a list of reasonable project assumptions.',
  generate_exclusions:
    'Based on the scope of work, generate a list of items and work that are NOT included in this proposal.',
  generate_email:
    'Write a professional follow-up email to send this proposal to the client.',
  generate_sms:
    'Write a short, friendly SMS message to notify the client that their proposal is ready.',
  generate_summary:
    'Write a brief executive summary of this proposal suitable for the client.',
  client_friendly_version:
    'Rewrite the scope of work in plain, easy-to-understand language for a non-technical client.',
  more_detailed_version:
    'Expand the scope of work with more technical detail and specificity.',
  short_version: 'Condense the scope of work into a shorter, concise version.',
  formal_version:
    'Rewrite the scope of work in formal, professional language.',
  compare_proposals:
    '(Option C) Compare two uploaded proposals and summarize differences.',
  extract_scope_from_doc:
    '(Option C) Extract the scope of work from an uploaded document.',
  extract_pricing_from_doc:
    '(Option C) Extract pricing data from an uploaded document.',
}

function getPrompt(
  action: AIProposalAction,
  promptSettings: AIPromptSettings
): string {
  const map: Record<AIProposalAction, keyof AIPromptSettings> = {
    generate_scope: 'generateScopeFromJobInfo',
    rewrite_scope: 'rewriteScopeProfessionally',
    identify_missing: 'identifyMissingDetails',
    generate_bom: 'generateBOMFromScope',
    generate_assumptions: 'generateAssumptions',
    generate_exclusions: 'generateExclusions',
    generate_email: 'generateEmail',
    generate_sms: 'generateSMS',
    generate_summary: 'generateProposalSummary',
    client_friendly_version: 'createClientFriendlyVersion',
    more_detailed_version: 'createMoreDetailedVersion',
    short_version: 'createShortVersion',
    formal_version: 'createFormalVersion',
    compare_proposals: 'compareUploadedProposals',
    extract_scope_from_doc: 'extractScopeFromDocument',
    extract_pricing_from_doc: 'extractPricingFromDocument',
  }
  const settingsKey = map[action]
  return (promptSettings[settingsKey] as string) || DEFAULT_PROMPTS[action]
}

// Placeholder-mode: Option C will connect this to the real backend
// TODO (Option C): wire to POST /generate-proposal-content on the backend
async function runPlaceholder(
  action: AIProposalAction,
  userPrompt: string
): Promise<string> {
  await new Promise((r) => setTimeout(r, 900))

  const examples: Partial<Record<AIProposalAction, string>> = {
    generate_scope: `Scope of Work — [AI Draft]\n\nThis project includes the complete removal and replacement of the existing roofing system on the main structure. Work includes:\n\n• Tear-off of existing shingles and underlayment\n• Inspection and replacement of damaged decking\n• Installation of ice and water shield at all eaves and valleys\n• Installation of synthetic underlayment\n• Installation of architectural shingles per client-selected color\n• Replacement of all pipe boots, vents, and flashing\n• Complete cleanup and haul-away of all debris\n\nAll work to be performed in accordance with local building codes and manufacturer specifications.`,
    generate_bom: `Bill of Materials — [AI Draft]\n\nThe following items are estimated based on the scope of work. All quantities and costs are approximate and should be verified.\n\n1. Architectural shingles (40 sq) — Material — $3,200\n2. Synthetic underlayment (42 sq) — Material — $420\n3. Ice & water shield (8 sq) — Material — $480\n4. Decking replacement (est. 4 sheets) — Material — $280\n5. Ridge cap shingles (8 bundles) — Material — $240\n6. Pipe boots (4 ea) — Material — $160\n7. Drip edge (200 LF) — Material — $180\n8. Labor — tear-off and installation — Labor — $4,800\n9. Dumpster / debris removal — Fee — $450\n10. Permit — Permit — $200\n\nNote: Final quantities to be confirmed during site visit.`,
    generate_assumptions: `Assumptions — [AI Draft]\n\n• Client will provide clear access to the work area during scheduled work hours\n• Existing roof deck is structurally sound (additional repairs billed separately if rot or damage is found)\n• Work will proceed in normal weather conditions\n• HOA approval, if required, has been or will be obtained by the client\n• Contractor's standard business hours apply unless otherwise agreed\n• All material selections will be confirmed with client prior to ordering`,
    generate_exclusions: `Exclusions — [AI Draft]\n\n• Interior work of any kind\n• Structural repairs beyond minor decking replacement\n• HVAC, plumbing, or electrical work\n• Gutter replacement (available as a separate add-on)\n• Painting or staining of any surfaces\n• Any work not specifically described in the scope above\n• Damage discovered after work commences that was not visible during initial inspection`,
    generate_email: `Subject: Your Proposal is Ready — [Job Title]\n\nHi [Client Name],\n\nThank you for the opportunity to work on your project. I've put together a detailed proposal for the work we discussed.\n\nYou can review the full scope, materials, and pricing in the attached proposal. Please take a look and let me know if you have any questions or would like to make any adjustments.\n\nI'm happy to walk through the details at your convenience.\n\nBest regards,\n[Contractor Name]\n[Company Name]\n[Phone]`,
    generate_sms: `Hi [Client Name], your proposal for [Job Title] is ready for review. Give me a call at [Phone] or reply here if you have questions. Ready to get started!`,
    generate_summary: `Proposal Summary — [AI Draft]\n\nThis proposal covers the complete replacement of the roofing system at [Property Address]. The project includes all labor, materials, and cleanup. Total investment is $[Total]. Work is estimated to be completed within [X] days of deposit receipt. This proposal is valid for 30 days.`,
  }

  return (
    examples[action] ??
    `[AI Placeholder — ${action}]\n\nInstruction: ${userPrompt}\n\nThis is a placeholder response. Connect to the AI backend in Option C to generate real content.`
  )
}

// Main AI service function
export async function runAIAction(
  action: AIProposalAction,
  proposal: Proposal,
  bomItems: BOMItem[],
  proposalSettings: ContractorProposalSettings,
  customPrompt?: string
): Promise<ProposalAIResult> {
  const promptTemplate = getPrompt(action, proposalSettings.aiPromptSettings)
  const userPrompt = customPrompt || promptTemplate

  // Placeholder actions (Option C features)
  const optionCActions: AIProposalAction[] = [
    'compare_proposals',
    'extract_scope_from_doc',
    'extract_pricing_from_doc',
  ]

  let output: string

  if (optionCActions.includes(action)) {
    output = `This feature will be available in Option C.\n\nAction: ${action}\n\nPlanned capability: ${DEFAULT_PROMPTS[action]}`
  } else {
    // TODO (Option C): Replace with real backend call
    // Example: apiPost('/generate-proposal-content', { action, prompt: userPrompt, proposal, bomItems })
    output = await runPlaceholder(action, userPrompt)

    // Attempt real backend call if endpoint exists (graceful fallback)
    try {
      const result = await apiPost<{ output: string }>(
        '/generate-proposal-content',
        {
          action,
          prompt: userPrompt,
          scope_of_work: proposal.scopeOfWork,
          title: proposal.title,
        }
      )
      if (result?.output) output = result.output
    } catch {
      // Backend endpoint not yet implemented — use placeholder above
    }
  }

  return {
    id: crypto.randomUUID(),
    proposalId: proposal.id,
    action,
    promptUsed: userPrompt,
    output,
    createdAt: new Date().toISOString(),
    source: 'ai_placeholder',
    confidence: 'low',
  }
}

export { DEFAULT_PROMPTS }
