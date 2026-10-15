export type ExperienceCategory = "journey" | "mission" | "local" | "learning";

export type Experience = {
  id: string;
  title: string;
  subtitle: string;
  category: ExperienceCategory;
  region: string;
  duration: string;
  cost: string;
  status: "기획 미리보기";
  tone: "sea" | "garden" | "market" | "city" | "field";
  icon: string;
  tags: string[];
  intro: string;
  highlights: string[];
  missionSteps: { id: string; label: string; detail: string }[];
};

export const categories: { id: "all" | ExperienceCategory; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "journey", label: "여행·체류" },
  { id: "mission", label: "봉사·미션" },
  { id: "local", label: "지역 발견" },
  { id: "learning", label: "배움·관계" },
];

export const experiences: Experience[] = [
  {
    id: "sorokdo-volcation",
    title: "소록도, 봉사와 섬에서의 하루",
    subtitle: "Volcation | 여행과 참여가 만나는 출발점",
    category: "journey",
    region: "전남 고흥·소록도",
    duration: "당일 / 1박 2일 / 2박 3일 구상",
    cost: "비용·일정 미정",
    status: "기획 미리보기",
    tone: "sea",
    icon: "🌊",
    tags: ["봉사여행", "섬", "느린 체류"],
    intro:
      "단순한 여행 상품보다, 섬에 머무는 시간과 지역의 일상을 함께 경험하는 참여형 프로그램을 구상합니다. 실제 봉사 활동과 방문은 관계 기관 협의와 승인 이후 확정됩니다.",
    highlights: ["섬과 지역을 이해하는 사전 안내", "선택 가능한 참여 활동", "경험과 관계를 돌아보는 기록"],
    missionSteps: [
      { id: "understand", label: "지역을 이해하기", detail: "소록도의 역사와 방문 예절을 알아봅니다." },
      { id: "choose", label: "나의 참여 방식 정하기", detail: "체류, 배움, 봉사 가운데 관심 활동을 선택합니다." },
      { id: "reflect", label: "한 문장 기록하기", detail: "어떤 경험을 남기고 싶은지 스스로 적어봅니다." },
    ],
  },
  {
    id: "goheung-local-table",
    title: "고흥의 시장과 로컬 식탁",
    subtitle: "잘 알려지지 않은 동네의 매력을 발견하는 하루",
    category: "local",
    region: "전남 고흥",
    duration: "반나절 코스 구상",
    cost: "제휴·가격 미정",
    status: "기획 미리보기",
    tone: "market",
    icon: "🍊",
    tags: ["시장", "로컬 먹거리", "소비"],
    intro:
      "지역 상점과 생산자를 소개하는 소비자 경험을 설계합니다. 실제 판매 상품, 상점 제휴, 할인 혜택은 아직 확정되지 않았습니다.",
    highlights: ["지역 상점 발견", "내 취향의 먹거리 찾기", "다음 방문 후보 저장"],
    missionSteps: [
      { id: "find", label: "찾아보고 싶은 곳 고르기", detail: "시장이나 식당 등 관심 장소 유형을 골라봅니다." },
      { id: "taste", label: "나만의 로컬 테마 정하기", detail: "음식, 사람, 장소 중 주제를 정합니다." },
      { id: "save", label: "다음 방문 계획하기", detail: "함께 가고 싶은 사람이나 시기를 떠올려 봅니다." },
    ],
  },
  {
    id: "goheung-blue-mission",
    title: "우리 동네 바다 지키기",
    subtitle: "현장에서 시작해 참여 기록으로 이어지는 작은 행동",
    category: "mission",
    region: "전남 고흥·해안",
    duration: "1~2시간 활동 구상",
    cost: "참여 조건 미정",
    status: "기획 미리보기",
    tone: "garden",
    icon: "🌱",
    tags: ["플로깅", "환경", "참여 기록"],
    intro:
      "안전하게 참여할 수 있는 환경 미션의 시범 흐름입니다. 현장 활동은 주최·안전·폐기물 처리 방식이 정해진 뒤 개설합니다.",
    highlights: ["안전 수칙 먼저 확인", "현장 참여 체크", "활동의 변화를 기록"],
    missionSteps: [
      { id: "safety", label: "안전 수칙 확인하기", detail: "날씨, 이동 경로, 보호장비를 먼저 확인합니다." },
      { id: "action", label: "실천 방식 고르기", detail: "정화 활동과 캠페인 등 할 수 있는 일을 생각해 봅니다." },
      { id: "record", label: "참여 의미 돌아보기", detail: "나의 작은 행동이 남긴 의미를 정리합니다." },
    ],
  },
  {
    id: "urban-escape",
    title: "Urban Escape, 도시를 다르게 걷기",
    subtitle: "낯선 지역의 평범한 하루에서 새로운 관계 찾기",
    category: "journey",
    region: "전국 · 거점 확장 구상",
    duration: "당일~체류형 기획",
    cost: "비용·일정 미정",
    status: "기획 미리보기",
    tone: "city",
    icon: "🚶",
    tags: ["도시 탐색", "로컬 경험", "관계"],
    intro:
      "관광 명소만 소비하는 여행이 아닌, 지역의 사람과 공간을 함께 발견하는 비영리 여행의 시범 콘셉트입니다.",
    highlights: ["나의 탐색 주제 선택", "지역의 작은 공간 발견", "관계가 남는 기록"],
    missionSteps: [
      { id: "theme", label: "오늘의 탐색 주제 정하기", detail: "골목, 공간, 사람, 역사 중 하나를 선택합니다." },
      { id: "connect", label: "지역에서 만날 활동 상상하기", detail: "지역 행사나 작은 가게 등 연결점을 찾아봅니다." },
      { id: "return", label: "다음 방문 이유 남기기", detail: "왜 다시 오고 싶은지 한 문장으로 정리합니다." },
    ],
  },
  {
    id: "dulle-sal-i",
    title: "둘레살이, 작은 배움과 나눔",
    subtitle: "각자의 재능이 누군가의 참여 기회가 되는 마을",
    category: "learning",
    region: "전국 · 분산형 마을 구상",
    duration: "프로젝트별 협의",
    cost: "운영 조건 미정",
    status: "기획 미리보기",
    tone: "field",
    icon: "🤝",
    tags: ["배움", "돌봄", "재능 공유"],
    intro:
      "장소에 한정되지 않는 참여 네트워크의 미리보기입니다. 능력과 시간이 각자의 강점과 기여로 연결될 수 있도록 구상합니다.",
    highlights: ["가용한 강점 발견", "나누고 싶은 활동 제안", "서로의 참여 연결"],
    missionSteps: [
      { id: "strength", label: "내 강점 하나 찾기", detail: "누군가에게 도움이 될 수 있는 경험을 떠올립니다." },
      { id: "share", label: "나누고 싶은 활동 고르기", detail: "배움, 도움, 동행 중 관심 분야를 정합니다." },
      { id: "connect", label: "함께할 사람 생각하기", detail: "어떤 사람과 함께하면 좋을지 정리해 봅니다." },
    ],
  },
];
