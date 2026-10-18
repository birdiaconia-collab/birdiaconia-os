import type { Metadata } from "next";
import BusinessExperience from "./BusinessExperience";

export const metadata: Metadata = {
  title: "Birdiaconia Business | 지속 가능한 수익모델",
  description: "Volcation, 지역상품 중개, 기관 서비스, OS 구독까지 버디아코니아의 영리형 서비스와 가정 기반 사업모델 시뮬레이터.",
};

export default function BusinessPage() {
  return <BusinessExperience />;
}
