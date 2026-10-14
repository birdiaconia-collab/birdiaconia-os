import Link from "next/link";
import styles from "./home.module.css";

const projects = [
  {
    name: "소록도 봉사여행",
    state: "운영 구조 구축 중",
    summary: "봉사·체류·배움·관계를 한 번의 참여가 아니라 다음 활동까지 이어지는 흐름으로 연결합니다.",
    meta: ["소록도·고흥", "월 2회 구조", "당일·1박2일·2박3일"],
  },
  {
    name: "Urban Escape",
    state: "준비",
    summary: "지역을 소비하는 여행이 아니라 사람과 장소, 활동의 관계가 남는 비영리 여행 구조를 만듭니다.",
    meta: ["비영리 여행", "지역 관계", "체류"],
  },
  {
    name: "둘레살이꿈이룸터",
    state: "설계",
    summary: "한 지역에 갇히지 않고 여러 거점을 하나의 마을처럼 연결하는 분산형 생활·활동 네트워크입니다.",
    meta: ["분산 네트워크", "지역 거점", "관계"],
  },
];

const flow = [
  ["01", "발견", "나에게 맞는 프로젝트와 활동을 찾습니다."],
  ["02", "신청", "한 번 입력한 사실은 이후 참여에서 다시 사용합니다."],
  ["03", "참여", "일정·역할·안내가 하나의 프로젝트 흐름으로 연결됩니다."],
  ["04", "기록", "출석·사진·메모 같은 최소 사실만 남깁니다."],
  ["05", "연결", "AI가 참여·활동·기여·재정·기록으로 구조화합니다."],
  ["06", "다음 활동", "쌓인 관계와 기여가 다음 프로젝트와 연결됩니다."],
];

export default function Home() {
  return (
    <main className={styles.site}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>B</span>
          <span>
            <strong>Birdiaconia</strong>
            <small>버디아코니아</small>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/discover">경험 찾기</Link>
          <a href="#projects">프로젝트</a>
          <a href="#flow">참여 흐름</a>
          <a href="#about">버디아코니아</a>
          <Link className={styles.opsLink} href="/ops">운영실</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>BIRDIACONIA · PEOPLE × PROJECTS × RELATIONSHIPS</p>
          <h1>하고 싶은 일을 찾고,<br />관계가 다음 활동으로 이어지게.</h1>
          <p className={styles.lead}>
            버디아코니아는 봉사, 체류, 배움, 돌봄과 지역 활동을 따로 관리하지 않습니다.
            사람과 프로젝트의 실제 참여를 하나의 흐름으로 연결합니다.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/discover">지역 경험 발견하기</Link>
            <a className={styles.secondaryButton} href="#projects">프로젝트 보기</a>

          </div>
        </div>
        <aside className={styles.heroAside}>
          <span>운영 원칙</span>
          <strong>한 번 입력한 사실은 다시 입력하지 않는다.</strong>
          <p>
            신청부터 활동, 기록, 기여, 정산과 보고까지 같은 사실을 재사용하는 것이
            Birdiaconia Core의 출발점입니다.
          </p>
        </aside>
      </section>

      <section className={styles.section} id="projects">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>PROJECTS</p>
            <h2>지금 만들어가는 활동</h2>
          </div>
          <p>프로젝트는 게시글이 아니라 사람·일정·활동·기여·기록이 연결되는 실행 단위입니다.</p>
        </div>
        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <article className={styles.projectCard} key={project.name}>
              <div className={styles.projectTop}>
                <strong>{project.name}</strong>
                <span>{project.state}</span>
              </div>
              <p>{project.summary}</p>
              <div className={styles.metaList}>
                {project.meta.map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.flowSection} id="flow">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>ONE CONTINUOUS FLOW</p>
            <h2>신청하고 끝나는 사이트가 아닙니다.</h2>
          </div>
          <p>현실에서 일어난 한 번의 참여가 다음 관계와 운영 데이터로 이어집니다.</p>
        </div>
        <div className={styles.flowGrid}>
          {flow.map(([number, title, description]) => (
            <article className={styles.flowCard} key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.agentSection} id="about">
        <div>
          <p className={styles.eyebrow}>AI BEHIND THE SERVICE</p>
          <h2>AI는 앞에 서지 않고, 뒤에서 일을 이어갑니다.</h2>
        </div>
        <div className={styles.agentExplanation}>
          <p>
            사람에게 필요한 것은 복잡한 관리 화면이 아니라 참여와 관계입니다. 신청이
            들어오면 뒤에서는 Event Runtime이 사람·프로젝트·참여를 연결하고, 필요한
            Action과 사람의 승인 지점을 만듭니다.
          </p>
          <div className={styles.runtimeFlow}>
            <span>사용자 행동</span><b>→</b><span>EVENT</span><b>→</b><span>CORE</span><b>→</b>
            <span>ACTION</span><b>→</b><span>승인</span><b>→</b><span>LOG</span>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <p className={styles.eyebrow}>BIRDIACONIA OS</p>
        <h2>사이트는 입구이고, 운영은 뒤에서 이어집니다.</h2>
        <p>운영자는 별도 운영실에서 오늘의 판단, 입력, 실행 상태와 기록을 확인합니다.</p>
        <Link className={styles.primaryButton} href="/ops">운영실 보기</Link>
      </section>

      <footer className={styles.footer}>
        <strong>Birdiaconia</strong>
        <span>봉사 · 체류 · 배움 · 관계 · 통합돌봄</span>
      </footer>
    </main>
  );
}
