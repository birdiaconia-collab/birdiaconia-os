export type CommercialStreamId = "volcation" | "local-trade" | "studio" | "os-service";

export type CommercialAssumptions = {
  units: number;
  revenuePerUnit: number;
  directCostPerUnit: number;
  monthlyFixedCost: number;
  paymentFeePercent: number;
};

export type CommercialStream = {
  id: CommercialStreamId;
  name: string;
  label: string;
  unitName: string;
  revenueUnitDescription: string;
  description: string;
  salesMechanism: string;
  firstMilestone: string;
  caution: string;
  assumptions: CommercialAssumptions;
};

export const COMMERCIAL_STREAMS: readonly CommercialStream[] = [
  {
    id: "volcation",
    name: "Volcation",
    label: "체류 · 경험",
    unitName: "참여자",
    revenueUnitDescription: "프로그램 운영 대가 / 1명",
    description: "소록도·고흥의 체험, 배움, 지역 연결을 서비스로 기획합니다.",
    salesMechanism: "자체 운영 프로그램 용역 또는 제휴사 기획·운영 수수료",
    firstMilestone: "운영 가능한 1개 체험 프로그램과 유료 기획 의뢰 확보",
    caution: "숙박·운송이 포함된 여행상품 판매나 예약·결제는 여행업 등 법적 요건 검토 후 진행",
    assumptions: { units: 12, revenuePerUnit: 130000, directCostPerUnit: 78000, monthlyFixedCost: 420000, paymentFeePercent: 3 },
  },
  {
    id: "local-trade",
    name: "Local Trade",
    label: "지역상품 중개",
    unitName: "거래",
    revenueUnitDescription: "중개 수수료 매출 / 1건",
    description: "생산자가 아닌 지역 파트너의 상품을 발굴하고 판매를 연결합니다.",
    salesMechanism: "계약에 따라 확정한 중개 수수료 또는 위탁판매 대행 수수료",
    firstMilestone: "생산자 2곳과 공급·환불·정산 기준 합의",
    caution: "상품 판매대금 전체가 아닌 버디아코니아의 수수료 수익을 기준으로 손익 계산",
    assumptions: { units: 75, revenuePerUnit: 6500, directCostPerUnit: 1200, monthlyFixedCost: 250000, paymentFeePercent: 0 },
  },
  {
    id: "studio",
    name: "Birdiaconia Studio",
    label: "기관 대상 서비스",
    unitName: "계약",
    revenueUnitDescription: "기획·교육 용역 대가 / 1건",
    description: "프로그램 설계, 현장 운영, 관계형 돌봄 콘텐츠와 평가 도구를 제공합니다.",
    salesMechanism: "기획·교육·워크숍·프로젝트 운영에 대한 계약별 용역비",
    firstMilestone: "제안서 1종, 결과물 샘플 1종과 유상 파일럿 1건",
    caution: "기관의 개인정보와 사례관리 기록은 별도 승인된 저장소에서만 처리",
    assumptions: { units: 2, revenuePerUnit: 850000, directCostPerUnit: 150000, monthlyFixedCost: 450000, paymentFeePercent: 0 },
  },
  {
    id: "os-service",
    name: "Birdiaconia OS Service",
    label: "디지털 서비스",
    unitName: "이용기관",
    revenueUnitDescription: "월 사용료 / 기관 1곳",
    description: "운영 템플릿, 기록·정산 도구, 자동 문서화 기능을 기관에 제공합니다.",
    salesMechanism: "월 구독료 및 별도의 초기 설정·교육 용역비",
    firstMilestone: "실사용 가능한 운영 기능 1개와 테스트 기관 1곳",
    caution: "인증·접근권한·개인정보·과금·지원 체계가 갖춰지기 전에는 유료 구독을 시작하지 않음",
    assumptions: { units: 10, revenuePerUnit: 79000, directCostPerUnit: 12000, monthlyFixedCost: 360000, paymentFeePercent: 3 },
  },
];

export type CommercialProjection = {
  revenue: number;
  directCosts: number;
  fees: number;
  fixedCosts: number;
  contribution: number;
  operatingResult: number;
  operatingMarginPercent: number;
  breakEvenUnits: number | null;
};

export function sanitizeAssumptions(value: CommercialAssumptions): CommercialAssumptions {
  const money = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(Math.round(n), 1000000000)) : 0;
  return {
    units: Math.min(1000000, money(value.units)),
    revenuePerUnit: money(value.revenuePerUnit),
    directCostPerUnit: money(value.directCostPerUnit),
    monthlyFixedCost: money(value.monthlyFixedCost),
    paymentFeePercent: Number.isFinite(value.paymentFeePercent)
      ? Math.max(0, Math.min(value.paymentFeePercent, 100))
      : 0,
  };
}

/** Illustrative monthly unit economics, not an invoice, accounting entry, or forecast. */
export function projectCommercialModel(raw: CommercialAssumptions): CommercialProjection {
  const a = sanitizeAssumptions(raw);
  const revenue = a.units * a.revenuePerUnit;
  const directCosts = a.units * a.directCostPerUnit;
  const fees = Math.round(revenue * (a.paymentFeePercent / 100));
  const fixedCosts = a.monthlyFixedCost;
  const contribution = revenue - directCosts - fees;
  const operatingResult = contribution - fixedCosts;
  const operatingMarginPercent = revenue > 0 ? (operatingResult / revenue) * 100 : 0;
  const unitContribution = a.revenuePerUnit * (1 - a.paymentFeePercent / 100) - a.directCostPerUnit;
  const breakEvenUnits = unitContribution > 0
    ? Math.ceil(fixedCosts / unitContribution)
    : null;
  return { revenue, directCosts, fees, fixedCosts, contribution, operatingResult, operatingMarginPercent, breakEvenUnits };
}

export const formatWon = (value: number): string =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
