import { describe, it, expect, beforeEach } from "vitest";
import { uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_CAMPAIGN_NOT_FOUND = 101;
const ERR_INSUFFICIENT_FUNDS = 102;
const ERR_VOTE_NOT_APPROVED = 103;
const ERR_INVALID_AMOUNT = 104;
const ERR_ALREADY_LOCKED = 105;
const ERR_NOT_LOCKED = 106;
const ERR_INVALID_CAMPAIGN_ID = 107;
const ERR_INVALID_PROPOSAL_ID = 108;
const ERR_INVALID_RECIPIENT = 113;
const ERR_MAX_CAMPAIGNS_EXCEEDED = 114;
const ERR_INVALID_MIN_RELEASE = 117;
const ERR_INVALID_MAX_RELEASE = 118;
const ERR_INVALID_FEE_RATE = 119;
const ERR_AUTHORITY_NOT_SET = 116;

interface CampaignFunds {
  balance: number;
  locked: boolean;
  timestamp: number;
  recipient: string;
}

interface ApprovedRelease {
  amount: number;
  approved: boolean;
  releaser: string;
}

interface CampaignMetadata {
  name: string;
  description: string;
  goal: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class FundingPoolMock {
  state: {
    totalFunds: number;
    maxCampaigns: number;
    minReleaseAmount: number;
    maxReleaseAmount: number;
    platformFeeRate: number;
    authorityPrincipal: string;
    nextCampaignId: number;
    campaignFunds: Map<number, CampaignFunds>;
    approvedReleases: Map<string, ApprovedRelease>;
    campaignMetadata: Map<number, CampaignMetadata>;
  } = {
    totalFunds: 0,
    maxCampaigns: 500,
    minReleaseAmount: 100,
    maxReleaseAmount: 1000000,
    platformFeeRate: 5,
    authorityPrincipal: "ST1TEST",
    nextCampaignId: 0,
    campaignFunds: new Map(),
    approvedReleases: new Map(),
    campaignMetadata: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  contractOwner: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      totalFunds: 0,
      maxCampaigns: 500,
      minReleaseAmount: 100,
      maxReleaseAmount: 1000000,
      platformFeeRate: 5,
      authorityPrincipal: "ST1TEST",
      nextCampaignId: 0,
      campaignFunds: new Map(),
      approvedReleases: new Map(),
      campaignMetadata: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.contractOwner = "ST1TEST";
    this.stxTransfers = [];
  }

  getTotalFunds(): Result<number> {
    return { ok: true, value: this.state.totalFunds };
  }

  getCampaignFunds(campaignId: number): Result<CampaignFunds | undefined> {
    return { ok: true, value: this.state.campaignFunds.get(campaignId) };
  }

  getApprovedRelease(campaignId: number, proposalId: number): Result<ApprovedRelease | undefined> {
    const key = `${campaignId}-${proposalId}`;
    return { ok: true, value: this.state.approvedReleases.get(key) };
  }

  getCampaignMetadata(campaignId: number): Result<CampaignMetadata | undefined> {
    return { ok: true, value: this.state.campaignMetadata.get(campaignId) };
  }

  setAuthorityPrincipal(newAuthority: string): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (newAuthority === this.contractOwner) {
      return { ok: false, value: ERR_INVALID_RECIPIENT };
    }
    this.state.authorityPrincipal = newAuthority;
    return { ok: true, value: true };
  }

  setMaxCampaigns(newMax: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (newMax <= 0) {
      return { ok: false, value: ERR_INVALID_AMOUNT };
    }
    this.state.maxCampaigns = newMax;
    return { ok: true, value: true };
  }

  setMinReleaseAmount(newMin: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (newMin <= 0) {
      return { ok: false, value: ERR_INVALID_AMOUNT };
    }
    this.state.minReleaseAmount = newMin;
    return { ok: true, value: true };
  }

  setMaxReleaseAmount(newMax: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (newMax <= 0) {
      return { ok: false, value: ERR_INVALID_AMOUNT };
    }
    this.state.maxReleaseAmount = newMax;
    return { ok: true, value: true };
  }

  setPlatformFeeRate(newRate: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (newRate < 0 || newRate > 10) {
      return { ok: false, value: ERR_INVALID_FEE_RATE };
    }
    this.state.platformFeeRate = newRate;
    return { ok: true, value: true };
  }

  createCampaign(name: string, description: string, goal: number, recipient: string): Result<number> {
    if (goal <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (recipient === this.contractOwner) return { ok: false, value: ERR_INVALID_RECIPIENT };
    if (this.state.nextCampaignId >= this.state.maxCampaigns) return { ok: false, value: ERR_MAX_CAMPAIGNS_EXCEEDED };
    const id = this.state.nextCampaignId;
    this.state.campaignFunds.set(id, { balance: 0, locked: false, timestamp: this.blockHeight, recipient });
    this.state.campaignMetadata.set(id, { name, description, goal });
    this.state.nextCampaignId++;
    return { ok: true, value: id };
  }

  depositFunds(campaignId: number, amount: number): Result<number> {
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (funds.locked) return { ok: false, value: ERR_ALREADY_LOCKED };
    this.stxTransfers.push({ amount, from: this.caller, to: "contract" });
    const newBalance = funds.balance + amount;
    this.state.campaignFunds.set(campaignId, { ...funds, balance: newBalance, timestamp: this.blockHeight });
    this.state.totalFunds += amount;
    return { ok: true, value: newBalance };
  }

  approveRelease(campaignId: number, proposalId: number, amount: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    if (proposalId <= 0) return { ok: false, value: ERR_INVALID_PROPOSAL_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (funds.balance < amount) return { ok: false, value: ERR_INSUFFICIENT_FUNDS };
    if (amount < this.state.minReleaseAmount) return { ok: false, value: ERR_INVALID_MIN_RELEASE };
    if (amount > this.state.maxReleaseAmount) return { ok: false, value: ERR_INVALID_MAX_RELEASE };
    const key = `${campaignId}-${proposalId}`;
    this.state.approvedReleases.set(key, { amount, approved: true, releaser: this.caller });
    return { ok: true, value: true };
  }

  releaseFunds(campaignId: number, proposalId: number): Result<number> {
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    if (proposalId <= 0) return { ok: false, value: ERR_INVALID_PROPOSAL_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    const key = `${campaignId}-${proposalId}`;
    const release = this.state.approvedReleases.get(key);
    if (!release || !release.approved) return { ok: false, value: ERR_VOTE_NOT_APPROVED };
    if (funds.balance < release.amount) return { ok: false, value: ERR_INSUFFICIENT_FUNDS };
    const fee = (release.amount * this.state.platformFeeRate) / 100;
    this.stxTransfers.push({ amount: fee, from: "contract", to: this.state.authorityPrincipal });
    const netAmount = release.amount - fee;
    this.stxTransfers.push({ amount: netAmount, from: "contract", to: funds.recipient });
    const newBalance = funds.balance - release.amount;
    this.state.campaignFunds.set(campaignId, { ...funds, balance: newBalance, locked: true, timestamp: this.blockHeight });
    this.state.totalFunds -= release.amount;
    return { ok: true, value: netAmount };
  }

  lockCampaign(campaignId: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (funds.locked) return { ok: false, value: ERR_ALREADY_LOCKED };
    this.state.campaignFunds.set(campaignId, { ...funds, locked: true, timestamp: this.blockHeight });
    return { ok: true, value: true };
  }

  unlockCampaign(campaignId: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (!funds.locked) return { ok: false, value: ERR_NOT_LOCKED };
    this.state.campaignFunds.set(campaignId, { ...funds, locked: false, timestamp: this.blockHeight });
    return { ok: true, value: true };
  }

  updateCampaignMetadata(campaignId: number, newName: string, newDescription: string, newGoal: number): Result<boolean> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    const metadata = this.state.campaignMetadata.get(campaignId);
    if (!metadata) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (newGoal <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    this.state.campaignMetadata.set(campaignId, { name: newName, description: newDescription, goal: newGoal });
    return { ok: true, value: true };
  }

  withdrawEmergency(campaignId: number, amount: number): Result<number> {
    if (this.caller !== this.contractOwner && this.caller !== this.state.authorityPrincipal) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (campaignId >= this.state.nextCampaignId) return { ok: false, value: ERR_INVALID_CAMPAIGN_ID };
    const funds = this.state.campaignFunds.get(campaignId);
    if (!funds) return { ok: false, value: ERR_CAMPAIGN_NOT_FOUND };
    if (funds.balance < amount) return { ok: false, value: ERR_INSUFFICIENT_FUNDS };
    this.stxTransfers.push({ amount, from: "contract", to: this.contractOwner });
    const newBalance = funds.balance - amount;
    this.state.campaignFunds.set(campaignId, { ...funds, balance: newBalance, timestamp: this.blockHeight });
    this.state.totalFunds -= amount;
    return { ok: true, value: newBalance };
  }
}

describe("FundingPool", () => {
  let contract: FundingPoolMock;

  beforeEach(() => {
    contract = new FundingPoolMock();
    contract.reset();
  });

  it("creates a campaign successfully", () => {
    const result = contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.balance).toBe(0);
    expect(funds?.locked).toBe(false);
    expect(funds?.recipient).toBe("ST2RECIP");
    const metadata = contract.getCampaignMetadata(0).value;
    expect(metadata?.name).toBe("Campaign1");
    expect(metadata?.goal).toBe(1000);
  });

  it("rejects campaign creation with invalid goal", () => {
    const result = contract.createCampaign("Invalid", "Desc", 0, "ST2RECIP");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("deposits funds successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    const result = contract.depositFunds(0, 500);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(500);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.balance).toBe(500);
    const total = contract.getTotalFunds().value;
    expect(total).toBe(500);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "contract" }]);
  });

  it("approves release successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 1000);
    const result = contract.approveRelease(0, 1, 500);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const release = contract.getApprovedRelease(0, 1).value;
    expect(release?.amount).toBe(500);
    expect(release?.approved).toBe(true);
  });

  it("rejects approve release with insufficient funds", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 400);
    const result = contract.approveRelease(0, 1, 500);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INSUFFICIENT_FUNDS);
  });

  it("releases funds successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 1000);
    contract.approveRelease(0, 1, 1000);
    const result = contract.releaseFunds(0, 1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(950);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.balance).toBe(0);
    expect(funds?.locked).toBe(true);
    const total = contract.getTotalFunds().value;
    expect(total).toBe(0);
    expect(contract.stxTransfers).toEqual([
      { amount: 1000, from: "ST1TEST", to: "contract" },
      { amount: 50, from: "contract", to: "ST1TEST" },
      { amount: 950, from: "contract", to: "ST2RECIP" },
    ]);
  });

  it("rejects release without approval", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 1000);
    const result = contract.releaseFunds(0, 1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VOTE_NOT_APPROVED);
  });

  it("locks campaign successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    const result = contract.lockCampaign(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.locked).toBe(true);
  });

  it("rejects lock on already locked campaign", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.lockCampaign(0);
    const result = contract.lockCampaign(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_LOCKED);
  });

  it("unlocks campaign successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.lockCampaign(0);
    const result = contract.unlockCampaign(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.locked).toBe(false);
  });

  it("rejects unlock on unlocked campaign", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    const result = contract.unlockCampaign(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_LOCKED);
  });

  it("updates metadata successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    const result = contract.updateCampaignMetadata(0, "NewName", "NewDesc", 2000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const metadata = contract.getCampaignMetadata(0).value;
    expect(metadata?.name).toBe("NewName");
    expect(metadata?.description).toBe("NewDesc");
    expect(metadata?.goal).toBe(2000);
  });

  it("rejects metadata update with invalid goal", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    const result = contract.updateCampaignMetadata(0, "NewName", "NewDesc", 0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("withdraws emergency successfully", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 1000);
    const result = contract.withdrawEmergency(0, 500);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(500);
    const funds = contract.getCampaignFunds(0).value;
    expect(funds?.balance).toBe(500);
    const total = contract.getTotalFunds().value;
    expect(total).toBe(500);
    expect(contract.stxTransfers).toEqual([
      { amount: 1000, from: "ST1TEST", to: "contract" },
      { amount: 500, from: "contract", to: "ST1TEST" },
    ]);
  });

  it("rejects emergency withdraw with insufficient funds", () => {
    contract.createCampaign("Campaign1", "Desc1", 1000, "ST2RECIP");
    contract.depositFunds(0, 400);
    const result = contract.withdrawEmergency(0, 500);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INSUFFICIENT_FUNDS);
  });

  it("sets platform fee rate successfully", () => {
    const result = contract.setPlatformFeeRate(3);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.platformFeeRate).toBe(3);
  });

  it("rejects invalid platform fee rate", () => {
    const result = contract.setPlatformFeeRate(15);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_FEE_RATE);
  });

  it("uses Clarity types for parameters", () => {
    const goal = uintCV(1000);
    expect(goal.value).toEqual(BigInt(1000));
  });
});