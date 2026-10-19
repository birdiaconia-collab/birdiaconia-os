import { redirect } from "next/navigation";
import { OpsDashboard } from "../../components/OpsDashboard";
import { authConfigured, previewEnvironmentAllowed, stagingWriteEnabled } from "../../lib/ops/access";
import { canOperatorReview, getOperatorEmail } from "../../lib/ops/auth";
import { listApplications, type OpsApplication } from "../../lib/ops/db";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  if (!previewEnvironmentAllowed()) {
    return <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Birdiaconia Operations</h1>
      <p>운영실은 승인된 Vercel Preview 브랜치에서만 활성화됩니다.</p>
      <p>Site와 Toss는 기존과 같이 별도로 유지되며, 운영 환경으로의 반영은 컨펌 종료 명령 이전까지 잠겨 있습니다.</p>
      <a href="/">공개 홈</a>
    </main>;
  }
  if (!authConfigured()) {
    return <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>운영 테스트 준비 중</h1>
      <p>Google 운영자 인증과 승인된 Preview URL이 아직 설정되지 않았습니다.</p>
      <p>계정·비밀키는 GitHub나 화면에 입력하지 않고 Vercel 환경변수로만 설정해야 합니다.</p>
    </main>;
  }
  const email = await getOperatorEmail();
  if (!email) redirect("/ops/login");
  let applications: OpsApplication[] = [];
  let storageError: string | null = null;
  const writable = stagingWriteEnabled();
  if (writable) {
    try { applications = await listApplications(); }
    catch { storageError = "스토리지 연결 또는 마이그레이션 확인이 필요합니다."; }
  } else {
    storageError = "Preview 쓰기 게이트가 닫혀 있습니다. 데이터 등록·승인은 비활성화됩니다.";
  }
  return <OpsDashboard email={email} canReview={canOperatorReview(email)}
    writable={writable && !storageError} initialApplications={applications} storageError={storageError}/>;
}
