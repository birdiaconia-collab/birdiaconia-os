/** Pure domain logic: a UI action and payment request never prove funds captured. */
export type BookingStatus="REQUESTED"|"PENDING_APPROVAL"|"CONFIRMED"|"CANCELLED"|"COMPLETED";
export type PaymentStatus="NOT_STARTED"|"PENDING"|"PAID"|"REFUND_PENDING"|"REFUNDED"|"FAILED";
const bookingMoves:Record<BookingStatus,readonly BookingStatus[]>={
 REQUESTED:["PENDING_APPROVAL","CANCELLED"],PENDING_APPROVAL:["CONFIRMED","CANCELLED"],
 CONFIRMED:["COMPLETED","CANCELLED"],CANCELLED:[],COMPLETED:[],
};
export function canMoveBooking(from:BookingStatus,to:BookingStatus):boolean{
 return bookingMoves[from]?.includes(to)??false;
}
export function canGrantBenefit(args:{
 missionVerified:boolean;partnerApproved:boolean;benefitActive:boolean;alreadyGranted:boolean;
}):boolean{return args.missionVerified&&args.partnerApproved&&args.benefitActive&&!args.alreadyGranted;}
export type SettlementInput={
 grossMerchandiseValueWon:number;partnerPayableWon:number;companyGrossRevenueWon:number;
 paymentFeesWon:number;refundsWon:number;directCostsWon:number;
};
export function calculateSettlement(a:SettlementInput){
 for(const value of Object.values(a))if(!Number.isSafeInteger(value)||value<0)throw new Error("Invalid KRW amount");
 if(a.refundsWon>a.grossMerchandiseValueWon)throw new Error("Refunds exceed GMV");
 if(a.companyGrossRevenueWon+a.partnerPayableWon>a.grossMerchandiseValueWon)throw new Error("Double counted sales");
 return {
  netGmvWon:a.grossMerchandiseValueWon-a.refundsWon,
  companyGrossRevenueWon:a.companyGrossRevenueWon,
  netCompanyContributionWon:a.companyGrossRevenueWon-a.paymentFeesWon-a.directCostsWon,
 };
}
