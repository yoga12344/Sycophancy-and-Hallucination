/**
 * SYCOGUARD Types & Data Contracts
 * "Sycophancy & Hallucination Firewall"
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type InterventionType = 
  | 'PASS'
  | 'QUALIFY'
  | 'BALANCE'
  | 'REWRITE'
  | 'HIGH_RISK_INTERVENTION';

export interface EpistemicSignals {
  confirmationSeeking: number;       // 0 to 1 (e.g. 0.96)
  agreementPressure: number;         // 0 to 1 (e.g. 0.98)
  evidenceSuppression: number;       // 0 to 1 (e.g. 0.94)
  unsupportedCertainty: number;      // 0 to 1 (e.g. 0.91)
  claimStrength: number;             // 0 to 1
  factualGrounding: number;          // 0 to 1
  contradictoryEvidence: number;     // 0 to 1
  modelSycophancy: number;           // 0 to 1 (measured on LLM draft)
  trajectoryReinforcement: number;   // 0 to 1
  detectedMarkers: string[];
}

export type ClaimStatus = 'supported' | 'contradicted' | 'uncertain' | 'unverifiable';

export interface AtomicClaim {
  id: string;
  claim: string;
  status: ClaimStatus;
  confidence: number;
  evidenceSource?: string;
  contradictoryEvidence?: string;
}

export type EvidenceClassification = 'SUPPORTING' | 'NEUTRAL' | 'CONTRADICTORY' | 'UNCERTAIN';

export interface EvidenceItem {
  id: string;
  snippet: string;
  source: string;
  classification: EvidenceClassification;
  relevanceScore: number;
  biasNote?: string;
}

export interface SycophancyAnalysis {
  score: number; // 0.0 to 1.0
  confidence: number;
  reasoning: string;
  signals: string[];
  validationStrength: number;
  evidenceSupportRatio: number;
  detectedHypothesis: string;
  agreementMarkers: string[];
}

export interface FactualityAnalysis {
  score: number; // Factual support ratio 0-1
  claims: AtomicClaim[];
  supportedCount: number;
  contradictedCount: number;
  unverifiedCount: number;
  summary: string;
}

export interface EvidenceBalanceAnalysis {
  balanceScore: number; // 0 (extreme cherry-picking) to 1 (perfectly balanced)
  supportingCount: number;
  contradictoryCount: number;
  neutralCount: number;
  evidenceItems: EvidenceItem[];
  imbalanceDetected: boolean;
  explanation: string;
}

export interface TrajectoryPoint {
  turn: number;
  userStance: number; // 0 (neutral / skeptic) to 1 (extreme certainty in hypothesis)
  aiValidation: number; // 0 to 1
  rawRisk: number; // 0 to 1
  interventionApplied: boolean;
  hypothesis?: string;
}

export interface TrajectoryAnalysis {
  reinforcementScore: number; // 0 to 1
  currentStance: number;
  previousStances: number[];
  stanceHistory: TrajectoryPoint[];
  spiralDetected: boolean;
  consecutiveValidations: number;
  trend: 'accelerating' | 'stable' | 'de-escalating' | 'neutral';
  explanation: string;
}

export interface RiskWeights {
  confirmationSeeking?: number;
  agreementPressure?: number;
  evidenceSuppression?: number;
  unsupportedCertainty?: number;
  factualGrounding?: number;
  modelSycophancy?: number;
  sycophancy: number;
  hallucination: number;
  evidenceImbalance: number;
  reinforcement: number;
}

export interface RiskAssessment {
  overallScore: number; // 0 to 1
  level: RiskLevel;
  weights: RiskWeights;
  components: {
    confirmationSeeking: number;
    agreementPressure: number;
    evidenceSuppression: number;
    unsupportedCertainty: number;
    claimStrength: number;
    factualGrounding: number;
    contradictoryEvidence: number;
    modelSycophancy: number;
    trajectoryReinforcement: number;
    sycophancy: number;
    hallucination: number;
    evidenceImbalance: number;
    reinforcement: number;
  };
  signals?: EpistemicSignals;
  triggers: string[];
  hardEscalations?: string[];
}

export interface InterventionResult {
  type: InterventionType;
  applied: boolean;
  reason: string;
  details: string;
  originalDraft: string;
  protectedResponse: string;
}

export interface FirewallTraceStep {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'skipped' | 'flagged';
  timestamp: number;
  durationMs: number;
  outputSummary: string;
  rawPayload?: Record<string, unknown>;
}

export type EpistemicCategory = 
  | 'GREETING'
  | 'CASUAL_CHAT'
  | 'NON_EPISTEMIC_TASK'
  | 'FACTUAL_QUERY'
  | 'EPISTEMIC_HYPOTHESIS'
  | 'CONFIRMATION_SEEKING';

export interface EpistemicRelevanceResult {
  isEpistemicallyRelevant: boolean;
  category: EpistemicCategory;
  confidence: number;
  reason: string;
  detectedHypothesis?: string;
}

export type UserIntentType =
  | 'GREETING'
  | 'FACTUAL_QUESTION'
  | 'FACTUAL_CLAIM'
  | 'CONFIRMATION_SEEKING'
  | 'INFORMATION_REQUEST'
  | 'INFORMATION_SHARING'
  | 'EXPLANATION_REQUEST'
  | 'SUMMARY_REQUEST'
  | 'ANALYSIS_REQUEST'
  | 'CODE_REQUEST'
  | 'CODE_INPUT'
  | 'DOCUMENT_INPUT'
  | 'PROJECT_DESCRIPTION'
  | 'CONVERSATION_CONTINUATION'
  | 'OPINION_REQUEST'
  | 'OPINION_EXPRESSION'
  | 'INSTRUCTION'
  | 'COMPARISON_REQUEST'
  | 'MULTI_PART_REQUEST'
  | 'INCOMPLETE_OR_AMBIGUOUS'
  | 'QUESTION'; // Legacy alias

export type ExpectedOutputType =
  | 'DIRECT_ANSWER'
  | 'EXPLANATION'
  | 'SUMMARY'
  | 'ANALYSIS'
  | 'CODE'
  | 'CLAIM_VERIFICATION'
  | 'COMPARISON'
  | 'INFORMATIONAL_RESPONSE'
  | 'CLARIFICATION'
  | 'CONVERSATIONAL_RESPONSE'
  | 'EVALUATION'
  | 'answer' | 'code' | 'summary' | 'analysis' | 'explanation' | 'acknowledgment' | 'clarification' | 'evaluation';

export interface DetectedIntent {
  intentType: UserIntentType;
  primaryTopic: string;
  keyEntities: string[];
  claim?: string;
  requestedAction?: string;
  expectedOutputType: ExpectedOutputType;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  multiPartQuestions?: string[];
  contextDependencies?: string[];
  conversationDependency: boolean;
  resolvedUserRequest: string;
  rawUserMessage: string;
}

export type ResponseRelevanceStatus = 'ALIGNED' | 'PARTIALLY_ALIGNED' | 'UNRELATED';

export interface ResponseRelevanceAnalysis {
  isAligned: boolean;
  status: ResponseRelevanceStatus;
  overallRelevanceScore: number;  // 0 to 1
  intentAlignmentScore: number;   // 0 to 1
  topicAlignmentScore: number;    // 0 to 1
  requestAlignmentScore: number;  // 0 to 1
  contextAlignmentScore: number;  // 0 to 1
  semanticRelevanceScore: number; // 0 to 1
  expectedOutputMatch: number;    // 0 to 1
  completenessScore: number;      // 0 to 1
  instructionFollowingScore: number; // 0 to 1
  formatComplianceScore?: number;
  taskCompletionScore?: number;
  passiveRefusalOrAcknowledgment?: boolean;
  multiPartCoverage?: number;
  dimensionScores?: {
    intentAlignment: number;
    topicAlignment: number;
    requestAlignment: number;
    contextAlignment: number;
    semanticRelevance: number;
    expectedOutputMatch: number;
    completeness: number;
    instructionFollowing: number;
    formatCompliance: number;
    multiPartCoverage: number;
    taskCompletion: number;
  };
  unsupportedAssumptions: string[];
  contextContaminationDetected: boolean;
  detectedMisalignments: string[];
  regenerationRequired: boolean;
  regenerationReason?: string;
  regenerated?: boolean;
  attemptCount?: number;
}

export interface FinalValidationResult {
  isValid: boolean;
  score: number;
  checks: {
    answersUserRequest: boolean;
    preservesIntent: boolean;
    respectsContext: boolean;
    avoidsUnrelatedContent: boolean;
    avoidsUnsupportedAssumptions: boolean;
    matchesExpectedFormat: boolean;
    preservesIntervention: boolean;
  };
  reason?: string;
}

export interface FirewallAnalysis {
  intent?: DetectedIntent;
  responseRelevance?: ResponseRelevanceAnalysis;
  epistemicRelevance?: EpistemicRelevanceResult;
  sycophancy: SycophancyAnalysis;
  factuality: FactualityAnalysis;
  evidenceBalance: EvidenceBalanceAnalysis;
  trajectory: TrajectoryAnalysis;
  risk: RiskAssessment;
  intervention: InterventionResult;
  trace: FirewallTraceStep[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  rawDraft?: string;
  analysis?: FirewallAnalysis;
  isDemo?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  mode: 'live' | 'comparison';
}

export interface SimulationConfig {
  sycophancyPi: number; // 0 to 1
  rounds: number; // 10, 25, 50, 100
  numSimulations: number; // e.g. 20
  botType: 'fair' | 'sycophantic';
  factuality: 'factual' | 'fabricating';
  userType: 'naive' | 'sycophancy_aware';
  worldTruth: 'H0' | 'H1';
  priorP1: number; // initial belief, e.g. 0.5
}

export interface SimulationRoundData {
  round: number;
  avgBelief: number;
  minBelief: number;
  maxBelief: number;
  fairAvgBelief: number;
  spiralCount: number;
}

export interface SimulationDistributionBin {
  bin: string;
  count: number;
  fairCount: number;
}

export interface SimulationResult {
  config: SimulationConfig;
  roundsData: SimulationRoundData[];
  finalDistribution: SimulationDistributionBin[];
  spiralRiskPercentage: number;
  fairSpiralRiskPercentage: number;
  averageFinalConfidence: number;
  fairAverageFinalConfidence: number;
  summary: string;
}

export interface BenchmarkScenario {
  id: string;
  category: 'neutral_factual' | 'confirmation_seeking' | 'strongly_held' | 'selective_evidence' | 'factual_sycophancy' | 'repeated_reinforcement';
  title: string;
  description: string;
  userPrompt: string;
  expectedRiskLevel: RiskLevel;
  rawResponseSample: string;
  protectedResponseSample: string;
  keyInsights: string[];
}
