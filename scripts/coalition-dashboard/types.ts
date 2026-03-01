/**
 * @module Analytics/CoalitionIntelligence/Types
 * @description TypeScript interface and type declarations for the Coalition Intelligence Dashboard.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const d3: any;

// ========== Interfaces ==========

export interface PartyConfig {
  name: string;
  color: string;
  fullName: string;
}

export interface PartyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  fullName: string;
  color: string;
  influence: number;
}

export interface CoalitionLink extends d3.SimulationLinkDatum<PartyNode> {
  strength: number;
}

export interface VotingAnomaly {
  party: string;
  date: string;
  deviation: number;
  severity: string;
}

export interface AnnualVoteEntry {
  year: number;
  votes: number;
}

export interface HeatMapDatum {
  party1: string;
  party2: string;
  alignment: number;
}

export type CoalitionAlignment = Record<string, Record<string, number>>;
export type BehavioralPatterns = Record<string, number>;
export type AnnualVotes = Record<string, AnnualVoteEntry[]>;

export interface DataCache {
  coalitionAlignment: CoalitionAlignment | null;
  behavioralPatterns: BehavioralPatterns | null;
  decisionPatterns: d3.DSVRowString<string>[] | null;
  votingAnomalies: VotingAnomaly[] | null;
  annualVotes: AnnualVotes | null;
}

export interface DataFiles {
  coalition: string[];
  behavioral: string[];
  decision: string[];
  anomalyClassification: string[];
  anomalyByParty: string[];
  annualVotes: string[];
  decisionTrends: string[];
  partyMomentum: string[];
}

export interface DataConfig {
  files: DataFiles;
  useMockData: boolean;
}

