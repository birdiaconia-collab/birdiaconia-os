import Link from "next/link";
import type { BISAgent, BISSystem } from "../data/bisAgents";
import { getCurrentUser, getCurrentUserRole } from "../lib/workspace-auth";
import { getWorkspaceMode, rooms } from "../lib/workspace-config";
import { canViewRoom } from "../lib/workspace-permissions";
import { InputRoom } from "./InputRoom";
import { RoomCard } from "./RoomCard";
import { RuntimeProbe } from "./RuntimeProbe";
import { StorageStatusCard } from "./StorageStatusCard";
import { TodayRoom } from "./TodayRoom";

type WorkspaceShellProps = {
  bisAgents?: BISAgent[];
  bisSystem?: BISSystem;
};

export function WorkspaceShell({
  bisAgents = [],
  bisSystem,
}: WorkspaceShellProps = {}) {
  const mode = getWorkspaceMode();
  const role = getCurrentUserRole();
  const user = getCurrentUser();
  const visibleRooms = rooms.filter((room) => canViewRoom(role, room.id, mode));
  const activeCapabilities = bisAgents.filter((agent) => agent.status === "Active").length;

  return (
    <main className="workspace-shell">
      <aside className="sidebar" aria-label="Birdiaconia 운영실 탐색">
        <div className="brand">
          <Link className="brand-mark" href="/">B</Link>
          <div>
            <strong>Birdiaconia</strong>
            <span>운영실 · /ops</span>
          </div>
        </div>
        <div className="mode-pill">{mode} · {role}</div>
        <nav className="nav-list">
          <a className="active" href="#runtime">Runtime</a>
          {visibleRooms.map((room) => (
            <a href={`#${room.id}`} key={room.id} title={room.description}>
              {room.label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="content-panel">
        <header className="page-header">
          <p className="eyebrow">Birdiaconia Operations</p>
          <h1>운영은 화면이 아니라 실행 흐름으로 관리한다.</h1>
          <p>
            공개 사이트와 운영실을 분리했습니다. 이 화면은 Event를 받아 Core 변경안과
            Action을 만들고, 의미 있는 결정만 사람에게 남기는 실행 상태를 확인합니다.
          </p>
          <p className="integration-note">
            현재 사용자: {user.name} · Site → Event → Core → Action → Approval → Log
          </p>
        </header>

        <section className="operation-flow" aria-label="Runtime 운영 흐름">
          <span>Site / Toss / Google 입력</span>
          <strong>→</strong>
          <span>EVENT</span>
          <strong>→</strong>
          <span>CORE</span>
          <strong>→</strong>
          <span>ACTION</span>
          <strong>→</strong>
          <span>사람 승인</span>
          <strong>→</strong>
          <span>AUDIT LOG</span>
        </section>

        <RuntimeProbe />

        {canViewRoom(role, "today", mode) && <TodayRoom mode={mode} role={role} />}
        {canViewRoom(role, "input", mode) && <InputRoom mode={mode} role={role} />}

        {bisSystem && canViewRoom(role, "bis", mode) && (
          <RoomCard id="bis" eyebrow="BIS Internal Capabilities" title="하나의 Agent, 여러 내부 기능">
            <p className="muted">
              Research, Policy, Funding, Case, Data 등은 별도 챗봇 메뉴가 아니라 Event
              Runtime과 운영 Agent가 필요할 때 사용하는 내부 capability입니다.
            </p>
            <div className="status-list">
              <p><strong>등록된 내부 기능:</strong> {bisAgents.length}개</p>
              <p><strong>즉시 활용 가능:</strong> {activeCapabilities}개</p>
              <p><strong>운영 원칙:</strong> Human at meaningful decisions</p>
              <p><strong>현재 설명:</strong> {bisSystem.description}</p>
            </div>
          </RoomCard>
        )}

        {canViewRoom(role, "storage", mode) && <StorageStatusCard mode={mode} role={role} />}
      </section>
    </main>
  );
}
