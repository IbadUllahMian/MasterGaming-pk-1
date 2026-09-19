// Manual-finance records are empty until authenticated user submissions are verified by the tournament desk.
export type ReviewStatus = 'Pending'|'Approved'|'Rejected'|'Completed';
export type MembershipRecord = { status:'Free'|'Paid'; startDate:string; expiryDate:string; renewalStatus:string; reviewNote:string };
export type ManualTransaction = { id:string; type:string; amount:string; status:ReviewStatus; date:string; note:string };
export type PaymentProof = { id:string; registration:string; method:string; sender:string; reference:string; status:ReviewStatus; submitted:string };
export type WithdrawalRequest = { id:string; amount:string; method:string; details:string; status:ReviewStatus; submitted:string };
export type ReferralRecord = { code:string; total:number; successful:number; earnedCredits:string; reviewNote:string };
export type PromoCode = { code:string; status:'Active'|'Expired'; note:string };
export type CommissionRecord = { id:string; tournament:string; amount:string; status:ReviewStatus; reviewed:string };
export const membership: MembershipRecord | null = null;
export const manualTransactions: ManualTransaction[] = [];
export const paymentProofs: PaymentProof[] = [];
export const withdrawals: WithdrawalRequest[] = [];
export const referral: ReferralRecord | null = null;
export const promoCodes: PromoCode[] = [];
export const commissions: CommissionRecord[] = [];
