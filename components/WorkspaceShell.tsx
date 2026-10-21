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
          <Link href="/ops/documents">HWPX 문서 실행실 ↗</Link>
          <Link href="/ops/office">통합 문서실 ↗</Link>
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
            공개 사이트와 운영...[truncated]