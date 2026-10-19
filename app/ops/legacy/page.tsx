import { redirect } from "next/navigation";
import { WorkspaceShell } from "../../../components/WorkspaceShell";
import { bisAgents, bisSystem } from "../../../data/bisAgents";
import { getOperatorEmail } from "../../../lib/ops/auth";

export const dynamic = "force-dynamic";

export default async function LegacyOpsPage() {
  if (!await getOperatorEmail()) redirect("/ops/login");
  return <><aside style={{ padding: 16, background: "#fff1c3", color: "#352700" }}>
    <strong>기존 운영실 UI 미리보기</strong>
    <p>이전의 Today / Input / Storage 패널은 아직 실제 저장소와 연결되지 않은 설명 및 예시입니다. 실제 운영·승인은 새 운영실에서 처리합니다.</p>
    <a href="/ops">실제 Preview 운영실로 돌아가기</a>
  </aside><WorkspaceShell bisAgents={bisAgents} bisSystem={bisSystem}/></>;
}
