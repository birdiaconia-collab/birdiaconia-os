"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  categories,
  experiences,
  type Experience,
  type ExperienceCategory,
} from "../../data/experience-catalog";
import styles from "./discover.module.css";

type Draft = {
  id: string;
  name: string;
  place: string;
  idea: string;
};

type DemoState = {
  favorites: string[];
  checks: Record<string, string[]>;
  drafts: Draft[];
};

type CategoryFilter = "all" | ExperienceCategory;

const STORAGE_KEY = "birdiaconia:discover-preview:v1";
const EMPTY_STATE: DemoState = { favorites: [], checks: {}, drafts: [] };

function loadDemoState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const saved = JSON.parse(raw) as Partial<DemoState>;
    const favorites = Array.isArray(saved.favorites)
      ? saved.favorites.filter((id): id is string => typeof id === "string")
      : [];
    const checks: Record<string, string[]> = {};
    if (saved.checks && typeof saved.checks === "object" && !Array.isArray(saved.checks)) {
      for (const [key, values] of Object.entries(saved.checks)) {
        if (Array.isArray(values)) {
          checks[key] = values.filter((id): id is string => typeof id === "string");
        }
      }
    }
    const drafts = Array.isArray(saved.drafts)
      ? saved.drafts.filter(
          (item): item is Draft =>
            Boolean(item) &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.place === "string" &&
            typeof item.idea === "string",
        )
      : [];
    return { favorites, checks, drafts };
  } catch {
    return EMPTY_STATE;
  }
}

function categoryLabel(category: ExperienceCategory): string {
  return categories.find((entry) => entry.id === category)?.label ?? "경험";
}

export default function DiscoverPage() {
  const [demo, setDemo] = useState<DemoState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeId, setActiveId] = useState(experiences[0].id);
  const [draftName, setDraftName] = useState("");
  const [draftPlace, setDraftPlace] = useState("");
  const [draftIdea, setDraftIdea] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    setDemo(loadDemoState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {
      // The preview still works when the browser blocks local storage.
    }
  }, [demo, loaded]);

  const visibleExperiences = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("ko");
    return experiences.filter((experience) => {
      if (category !== "all" && experience.category !== category) return false;
      if (favoritesOnly && !demo.favorites.includes(experience.id)) return false;
      if (!searchTerm) return true;
      return [
        experience.title,
        experience.subtitle,
        experience.region,
        ...experience.tags,
      ]
        .join(" ")
        .toLocaleLowerCase("ko")
        .includes(searchTerm);
    });
  }, [category, search, favoritesOnly, demo.favorites]);

  const selected: Experience = experiences.find((item) => item.id === activeId) ?? experiences[0];
  const selectedChecks = demo.checks[selected.id] ?? [];
  const completedCount = selected.missionSteps.filter((step) => selectedChecks.includes(step.id)).length;
  const missionCompleted = completedCount === selected.missionSteps.length;

  function openDetail(id: string) {
    setActiveId(id);
    window.requestAnimationFrame(() => {
      document.getElementById("experience-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function toggleFavorite(id: string) {
    setDemo((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((item) => item !== id)
        : [...current.favorites, id],
    }));
  }

  function toggleStep(experienceId: string, stepId: string) {
    setDemo((current) => {
      const previous = current.checks[experienceId] ?? [];
      const next = previous.includes(stepId)
        ? previous.filter((item) => item !== stepId)
        : [...previous, stepId];
      return { ...current, checks: { ...current.checks, [experienceId]: next } };
    });
  }

  function addDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    const place = draftPlace.trim();
    const idea = draftIdea.trim();
    if (!name || !place || !idea) return;
    const draft: Draft = {
      id: "local-" + Date.now().toString(36),
      name,
      place,
      idea,
    };
    setDemo((current) => ({ ...current, drafts: [draft, ...current.drafts].slice(0, 20) }));
    setDraftSaved(true);
    setDraftName("");
    setDraftPlace("");
    setDraftIdea("");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="버디아코니아 홈페이지">
          <span className={styles.logo}>B</span>
          <span><strong>Birdiaconia</strong><small>경험 발견</small></span>
        </Link>
        <nav className={styles.headerLinks} aria-label="서비스 탐색">
          <Link href="/">홈</Link>
          <a href="#browse">경험 찾기</a>
          <a href="#propose">경험 제안</a>
          <Link href="/ops" className={styles.ops}>운영실</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.micro}>DISCOVER · EXPERIENCE · CONNECT</span>
          <h1>동네의 작은 경험이<br /><em>다음 이야기</em>가 되도록.</h1>
          <p>
            여행, 봉사, 동네 탐색과 배움을 하나의 경험으로 발견해 보세요.
            마음에 드는 활동을 담고, 내가 해보고 싶은 미션을 골라볼 수 있습니다.
          </p>
          <div className={styles.heroActions}>
            <a href="#browse" className={styles.actionPrimary}>경험 둘러보기 <span aria-hidden="true">↗</span></a>
            <a href="#how" className={styles.actionSecondary}>이용 흐름 보기</a>
          </div>
          <p className={styles.heroNotice}>현재는 콘셉트 체험판입니다. 신청·결제·현장 인증은 제공되지 않습니다.</p>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.sun}></div>
          <span className={styles.orbitLabel}>여행</span>
          <span className={styles.orbitLabelTwo}>지역</span>
          <span className={styles.orbitLabelThree}>참여</span>
          <div className={styles.heroBadge}>GOHEUNG<br /><strong>↗</strong></div>
          <div className={styles.heroHills}></div>
          <div className={styles.heroMessage}>가까운 곳에서<br />새로운 연결을.</div>
        </div>
      </section>

      <section className={styles.quickInfo} aria-label="서비스 소개">
        <div><span aria-hidden="true">✦</span><strong>경험을 발견</strong><small>흥미와 지역으로 찾기</small></div>
        <div><span aria-hidden="true">♡</span><strong>관심 활동 저장</strong><small>내 기기에서 다시 보기</small></div>
        <div><span aria-hidden="true">✓</span><strong>미션 체험</strong><small>체크리스트 미리보기</small></div>
      </section>

      <section id="browse" className={styles.browse}>
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>EXPLORE EXPERIENCES</p>
            <h2>어떤 경험이 끌리나요?</h2>
            <p>고흥·소록도에서 시작해 전국의 지역 경험으로 확장할 콘텐츠 구상입니다.</p>
          </div>
          <span className={styles.demoChip}>전체 콘텐츠 · 기획 예시 {experiences.length}개</span>
        </div>

        <div className={styles.browseTools}>
          <label className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <span className={styles.srOnly}>경험 검색</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="지역, 경험, 키워드로 찾기"
            />
          </label>
          <button
            type="button"
            className={[styles.savedButton, favoritesOnly ? styles.savedActive : ""].join(" ")}
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((current) => !current)}
          >
            ♡ 관심 목록 ({demo.favorites.length})
          </button>
        </div>

        <div className={styles.categoryBar} role="group" aria-label="경험 카테고리">
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              className={[styles.categoryButton, category === item.id ? styles.categoryActive : ""].join(" ")}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.resultLine}>
          <span>찾은 경험 <strong>{visibleExperiences.length}</strong>개</span>
          <span>실제 운영 일정·참가비는 확정 후 별도 안내</span>
        </div>

        <div className={styles.experienceGrid}>
          {visibleExperiences.map((experience) => {
            const isFavorite = demo.favorites.includes(experience.id);
            const progress = demo.checks[experience.id]?.length ?? 0;
            return (
              <article key={experience.id} className={styles.experienceCard}>
                <div className={[styles.art, styles[experience.tone]].join(" ")}>
                  <span className={styles.artIcon} aria-hidden="true">{experience.icon}</span>
                  <span className={styles.cardCategory}>{categoryLabel(experience.category)}</span>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(experience.id)}
                    className={[styles.heartButton, isFavorite ? styles.heartSaved : ""].join(" ")}
                    aria-label={experience.title + (isFavorite ? " 관심 목록에서 빼기" : " 관심 목록에 담기")}
                    aria-pressed={isFavorite}
                  >
                    {isFavorite ? "♥" : "♡"}
                  </button>
                </div>
                <div className={styles.cardContents}>
                  <span className={styles.place}>⌁ {experience.region}</span>
                  <h3>{experience.title}</h3>
                  <p>{experience.subtitle}</p>
                  <div className={styles.tagList}>
                    {experience.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                  </div>
                  <div className={styles.cardFooter}>
                    <span>{progress > 0 ? "미션 " + progress + "/" + experience.missionSteps.length + " 체크" : "기획 미리보기"}</span>
                    <button type="button" onClick={() => openDetail(experience.id)}>
                      자세히 보기 <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {visibleExperiences.length === 0 && (
            <div className={styles.noResults}>
              <strong>조건에 맞는 경험이 없어요.</strong>
              <p>다른 키워드로 검색하거나 카테고리와 관심 필터를 초기화해 보세요.</p>
              <button type="button" onClick={() => { setSearch(""); setCategory("all"); setFavoritesOnly(false); }}>
                전체 경험 보기
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="experience-detail" className={styles.detailArea} aria-labelledby="detail-heading">
        <div className={styles.detailIntro}>
          <p className={styles.eyebrow}>EXPERIENCE PREVIEW</p>
          <h2 id="detail-heading">이 경험을 조금 더 살펴볼까요?</h2>
          <p>활동 카드를 선택하면 이곳에서 내용을 확인하고 미션을 체험할 수 있습니다.</p>
        </div>
        <div className={styles.detailGrid}>
          <article className={styles.detailStory}>
            <div className={[styles.detailArt, styles[selected.tone]].join(" ")}>
              <span aria-hidden="true">{selected.icon}</span>
              <small>CONCEPT / NOT BOOKABLE</small>
            </div>
            <div className={styles.detailBody}>
              <span className={styles.detailCategory}>{categoryLabel(selected.category)} · {selected.status}</span>
              <h3>{selected.title}</h3>
              <p>{selected.intro}</p>
              <dl className={styles.facts}>
                <div><dt>지역</dt><dd>{selected.region}</dd></div>
                <div><dt>예상 형태</dt><dd>{selected.duration}</dd></div>
                <div><dt>비용</dt><dd>{selected.cost}</dd></div>
              </dl>
              <h4>이런 경험을 구상하고 있어요</h4>
              <ul className={styles.highlights}>
                {selected.highlights.map((text) => <li key={text}>{text}</li>)}
              </ul>
              <p className={styles.storyNotice}>
                현재는 안내용 콘셉트입니다. 실제 예약·결제·현장 참여 신청은 불가능합니다.
              </p>
            </div>
          </article>

          <aside className={styles.missionPanel} aria-label="미션 체험">
            <div className={styles.missionHeader}>
              <div>
                <span className={styles.eyebrow}>MY SMALL MISSION</span>
                <h3>3단계 미션 체험</h3>
              </div>
              <span className={styles.missionCount}>{completedCount}/{selected.missionSteps.length}</span>
            </div>
            <p className={styles.missionHint}>
              아래 항목은 <strong>스스로 체크하는 기획 시연</strong>입니다. 실제 활동 증명이나 공식 와펜 발급이 아닙니다.
            </p>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="미션 체험 체크 진행률"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={selected.missionSteps.length}
            >
              <div style={{ width: (completedCount / selected.missionSteps.length) * 100 + "%" }} />
            </div>
            <div className={styles.steps}>
              {selected.missionSteps.map((step, index) => {
                const checked = selectedChecks.includes(step.id);
                return (
                  <button
                    type="button"
                    key={step.id}
                    onClick={() => toggleStep(selected.id, step.id)}
                    aria-pressed={checked}
                    className={[styles.step, checked ? styles.stepChecked : ""].join(" ")}
                  >
                    <span className={styles.stepMark} aria-hidden="true">{checked ? "✓" : index + 1}</span>
                    <span className={styles.stepCopy}><strong>{step.label}</strong><small>{step.detail}</small></span>
                  </button>
                );
              })}
            </div>
            <div className={[styles.rewardPreview, missionCompleted ? styles.rewardUnlocked : ""].join(" ")}>
              <span aria-hidden="true">{missionCompleted ? "✦" : "◇"}</span>
              <div>
                <strong>{missionCompleted ? "미션 체험을 모두 체크했어요!" : "활동 와펜 미리보기"}</strong>
                <p>{missionCompleted ? "기기 내 체크 상태만 저장되었습니다. 공식 인증이나 실제 혜택은 아닙니다." : "단계를 모두 체크하면 미리보기 표시가 바뀝니다. 공식 발급 기능은 연결 전입니다."}</p>
              </div>
            </div>
            <button type="button" className={styles.keepButton} onClick={() => toggleFavorite(selected.id)}>
              {demo.favorites.includes(selected.id) ? "♥ 관심 목록에서 빼기" : "♡ 관심 목록에 담아두기"}
            </button>
          </aside>
        </div>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>HOW IT CONNECTS</p>
            <h2>발견에서 다음 참여까지</h2>
          </div>
          <p>버디아코니아가 만들려는 실제 서비스의 연결 구조입니다. 현재 체험판에서 동작하는 부분과 향후 연동할 부분을 구분합니다.</p>
        </div>
        <div className={styles.flow}>
          <div><span>01</span><strong>찾기</strong><small>지역 경험 탐색</small><em>체험 가능</em></div>
          <div><span>02</span><strong>담아두기</strong><small>관심 경험 기록</small><em>기기 내 저장</em></div>
          <div><span>03</span><strong>현장 참여</strong><small>신청·예약·현장 QR</small><em>추후 연동</em></div>
          <div><span>04</span><strong>기록·혜택</strong><small>검증된 활동·지역 혜택</small><em>추후 연동</em></div>
        </div>
      </section>

      <section id="propose" className={styles.propose}>
        <div className={styles.proposeIntro}>
          <span className={styles.eyebrow}>YOUR IDEA, OUR NEXT EXPERIENCE</span>
          <h2>당신이 아는 동네의 경험은?</h2>
          <p>
            지역을 잘 아는 사람이 직접 경험을 제안하는 기능도 구상하고 있습니다.
            지금은 전송 기능 대신 <strong>내 기기에 아이디어 초안을 보관</strong>하는 시연입니다.
          </p>
          <p className={styles.privacyNote}>이름, 연락처 등 개인정보를 입력하지 마세요. 이 초안은 운영자에게 전달되지 않습니다.</p>
          <div className={styles.draftCount}>이 기기에 저장된 제안 초안 <strong>{demo.drafts.length}개</strong></div>
        </div>
        <form className={styles.proposeForm} onSubmit={addDraft}>
          <label>경험 이름
            <input value={draftName} onChange={(event) => { setDraftName(event.target.value); setDraftSaved(false); }} maxLength={60} required placeholder="예: 우리 마을의 숨은 산책길" />
          </label>
          <label>지역
            <input value={draftPlace} onChange={(event) => { setDraftPlace(event.target.value); setDraftSaved(false); }} maxLength={60} required placeholder="예: 전남 고흥" />
          </label>
          <label>소개
            <textarea value={draftIdea} onChange={(event) => { setDraftIdea(event.target.value); setDraftSaved(false); }} maxLength={500} required rows={4} placeholder="누구와 무엇을 해보면 좋을까요?" />
          </label>
          <button type="submit">이 기기에 제안 초안 저장하기 <span aria-hidden="true">→</span></button>
          <p className={styles.formNote} aria-live="polite">
            {draftSaved ? "초안이 이 브라우저에 저장됐습니다. 아직 제출·전송되지 않았습니다." : "계정 가입이나 서버 전송 없이, 현재 브라우저에만 보관됩니다."}
          </p>
          {demo.drafts.length > 0 && (
            <div className={styles.drafts}>
              <strong>저장한 초안</strong>
              {demo.drafts.map((draft) => (
                <div key={draft.id} className={styles.draft}>
                  <span>{draft.place}</span>
                  <b>{draft.name}</b>
                  <p>{draft.idea}</p>
                  <button
                    type="button"
                    onClick={() => setDemo((current) => ({
                      ...current,
                      drafts: current.drafts.filter((item) => item.id !== draft.id),
                    }))}
                  >초안 삭제</button>
                </div>
              ))}
            </div>
          )}
        </form>
      </section>

      <footer className={styles.footer}>
        <div><strong>Birdiaconia</strong><small>봉사 · 체류 · 배움 · 관계 · 지역 경험</small></div>
        <div className={styles.footerRight}>
          <span>2026 · 소비자 경험 미리보기</span>
          <Link href="/">홈으로</Link>
          <Link href="/ops">운영실</Link>
        </div>
      </footer>
    </main>
  );
}
