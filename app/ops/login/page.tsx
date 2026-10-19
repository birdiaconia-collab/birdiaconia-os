import { redirect } from "next/navigation";
import Link from "next/link";
import { authConfigured, previewEnvironmentAllowed } from "../../../lib/ops/access";
import { getOperatorEmail } from "../../../lib/ops/auth";
import { OpsLoginButton } from "../../../components/OpsLoginButton";

export const dynamic = "force-dynamic";

export default async function OpsLoginPage() {
  const enabled = previewEnvironmentAllowed() && authConfigured();
  if (enabled && await getOperatorEmail()) redirect("/ops");
  return <main style={{ padding: "3rem 1rem", maxWidth: 620, margin: "0 auto" }}>
    <p style={{ letterSpacing: 2, fontSize: 12 }}>BIRDIACONIA / STAGING OPERATIONS</p>
    <h1>운영실 접근</h1>
    <p>Site와 Toss에서 분리된 운영 테스트 공간입니다. 권한이 부여된 Google 계정으로만 접근할 수 있습니다.</p>
    <p>실 운영 데이터는 Preview 인증·DB·감사로그 검증을 마친 뒤에만 다룹니다.</p>
    {enabled ? <OpsLoginButton/> : <p role="status">승인된 Preview 환경 또는 Google 인증 설정이 없어 로그인을 비활성화했습니다.</p>}
    <p><Link href="/">공개 홈페이지로 돌아가기</Link></p>
  </main>;
}
