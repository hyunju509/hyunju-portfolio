# CLAUDE.md — Hyunju Kim Portfolio Website

## 한 줄 컨셉
조용한 구조, 살아있는 반응. 레이아웃·타이포·컬러는 절제된 아카이브 톤으로 유지하되, 프로젝트의 위계와 이미지 선택으로 강한 인상을 만든다. 개성은 호버·전환·마이크로 인터랙션에서만 드러낸다. 뼈대는 명확하게, 만졌을 때 반응은 정교하게.

---

## 프로젝트 정의
- 목적: 미국 건축사무소 취업 지원용 포트폴리오 사이트. 1차 관객은 채용 담당자.
- 성공 기준:
  - 접속 3초 안에 실제 프로젝트 이미지가 보인다.
  - 30초 안에 가장 강한 프로젝트 3개가 기억된다.
  - 어떤 프로젝트든 2클릭 안에 도달한다.
- 배포: GitHub + Vercel 정적 호스팅.
- 기준 코드: 현재 작동 중인 `index.html` 및 기존 CSS/JS.
- 전면 재설계 금지. 기존 작동 구조를 최대한 유지하며 최소 diff로 개선한다.
- 참고 사이트의 구조와 리듬은 참고할 수 있지만, 특정 사이트의 복제본처럼 보이면 안 된다.

---

## 가장 중요한 원칙
1. 사이트에는 강한 프로젝트뿐 아니라 사용자가 보여주고 싶은 모든 프로젝트를 포함할 수 있다.
2. 모든 프로젝트에 같은 시각적 위계를 주지 않는다.
3. 강한 프로젝트는 위에, 크게, 더 깊게 보여준다.
4. 약하거나 오래된 프로젝트는 아래쪽 `More Work` 또는 `Archive` 영역에 배치하되 숨기지 않는다.
5. 프로젝트가 추가되었다는 이유만으로 CLAUDE.md 충돌로 처리하지 않는다.
6. 사용자의 최신 명시적 지시가 이 문서보다 우선한다.
7. 구조적 변경이 확정되면 이 문서를 업데이트해 다음 세션에서 같은 충돌을 반복하지 않는다.
8. 확인되지 않은 프로젝트 정보, 수치, 역할, 연도, 위치, 크레딧을 지어내지 않는다.
9. 없는 이미지를 다른 프로젝트 이미지로 대체하지 않는다.
10. 디자인은 “예쁘게”보다 프로젝트 위계와 건축적 신뢰도가 우선이다.

---

## 현재 승인된 홈페이지 구조

### 1. Hero
- Hyunju Kim
- Architectural Designer
- New York
- LEED AP BD+C
- 짧고 정확한 소개 문장
- 긴 마케팅 문구 금지
- 실제 프로젝트 이미지가 첫 화면 또는 첫 스크롤 안에 보여야 한다.

### 2. Selected Works
현재 최상위 프로젝트:

1. Fluid Terrain
2. Calibrated Environment
3. Surreal Museum Tower
4. Shadow Archive: Inverse Preserve
5. Ordinary Village: Hide and Seek
6. Ivanpah Solar Sanctuary
7. Spectrum Living

원칙:
- Desktop: 3-column
- Tablet: 2-column
- Mobile: 1-column
- 프로젝트당 1개의 명확한 entry
- 같은 프로젝트를 여러 masonry item으로 반복하지 않는다.
- 각 프로젝트는 대표 이미지 1장과 필요 시 hover용 secondary image 1장을 사용한다.
- 일반적으로 4:3 이미지 컨테이너를 사용하되, 도면·단면·타워 이미지는 무리하게 자르지 않는다.
- 프로젝트별로 `cover`, `contain`, 별도 crop 이미지를 판단해서 사용한다.

표시 권장 정보:
- project number
- project title
- location
- year
- type

### 3. More Work / Archive
현재 추가 프로젝트:

8. Terroir Hotsprings
9. Playful Layers

추가 과거 프로젝트는 이후 계속 들어올 수 있다.

원칙:
- Desktop: 3-column 또는 compact 2-column 중 시각적으로 더 나은 쪽
- Mobile: 1-column
- Selected Works보다 시각적 위계는 낮게
- 그러나 숨기거나 필터 전용으로 제한하지 않는다.
- 프로젝트를 추가할 때 전체 구조를 다시 논의하지 말고 project registry에 추가한다.

---

## 프로젝트 순서와 위계
현재 위계는 아래와 같다.

### Tier A — Selected Works
01 Fluid Terrain  
02 Calibrated Environment  
03 Surreal Museum Tower  
04 Shadow Archive: Inverse Preserve  
05 Ordinary Village: Hide and Seek  
06 Ivanpah Solar Sanctuary  
07 Spectrum Living  

### Tier B — More Work
08 Terroir Hotsprings  
09 Playful Layers  

- Tier A 순서는 임의로 자주 바꾸지 않는다.
- Tier B에는 향후 과거 프로젝트를 계속 추가할 수 있다.
- 약한 프로젝트는 삭제보다 압축 편집을 우선한다.
- 모든 프로젝트 페이지의 길이를 동일하게 맞추지 않는다.

---

## 프로젝트 상세 페이지 규칙

### Tier A 프로젝트
자료가 충분할 경우 6~10개의 의미 있는 섹션으로 구성할 수 있다.

가능한 섹션:
- Project Introduction
- Site Condition
- Research Question
- Concept / System
- Environmental Analysis
- Material Strategy
- Spatial Sequence
- Architectural Section
- Technical Assembly
- Seasonal / Temporal Change
- Occupation
- Final Image
- Credits
- Next Project

모든 프로젝트에 모든 섹션을 강제하지 않는다.

### Tier B 프로젝트
3~5개의 강한 섹션으로 압축한다.

예:
- Introduction
- Main Image
- Core Diagram or Plan
- Spatial / Technical Development
- Final Image
- Credits
- Next Project

자료가 약한 프로젝트를 긴 설명으로 억지로 늘리지 않는다.

---

## 디자인 방향

### 유지할 성격
- editorial
- architectural
- precise
- image-led
- quiet
- confident
- technically credible
- restrained
- asymmetrical only when useful

### 피할 것
- generic AI portfolio
- startup landing page
- SaaS UI
- rounded marketing cards
- gradients
- glow
- oversized pill buttons
- dark overlay
- blur-heavy hover
- excessive zoom
- custom cursor by default
- scroll hijacking
- autoplay audio
- decorative marquee
- random asymmetry
- fake metrics
- fake testimonials
- generic marketing slogans

---

## 기존 v11 요소의 현재 상태

### 유지
- Fraunces 900 wordmark 또는 현재 display serif 방향
- off-white background
- near-black text
- restrained serif + sans pairing
- slide-up project room 전환 패턴, 단 기능적으로 안정적일 경우
- 짧고 절제된 transition
- 현재의 조용한 editorial tone

### 더 이상 변경 금지 요소가 아님
- 4열 수동 masonry grid
- footer hashtag filter
- Seoul/NYC live clock
- Ordinary Village를 필터 전용으로 두는 규칙
- Ivanpah Solar Sanctuary 제외 규칙

이 요소들은 필요하면 삭제·변경할 수 있다.

---

## 인터랙션 규칙

### 권장
- 썸네일 hover 시 primary → secondary image crossfade
- caption 또는 metadata의 미세한 강조
- project room 진입/이탈 모션
- image fade + 미세 shift 수준의 scroll reveal

### 제한
- transition: 150~400ms
- ease-out 계열
- 한 화면에서 동시에 움직이는 요소 최대 2종
- `prefers-reduced-motion` 대응 필수
- 인터랙션은 콘텐츠 접근을 방해하면 안 된다.

### 금지
- scroll-jacking
- fullscreen intro
- 긴 loading animation
- 과도한 parallax
- 큰 zoom
- blur
- dark overlay
- autoplay sound
- custom cursor unless explicitly approved

---

## 타이포 / 컬러
- Display: Fraunces 900 또는 현재 승인된 serif 방향 유지.
- Caption / Meta / Body: 기존 보조 sans-serif 우선 유지.
- 배경: off-white.
- 텍스트: near-black.
- accent: 최대 1색.
- cream + terracotta, black + acid green 같은 전형적 AI template 팔레트로 드리프트하지 말 것.
- 텍스트가 이미지보다 먼저 보이면 안 된다.
- body text line length가 과도하게 길어지지 않도록 한다.
- all caps 남용 금지.
- 프로젝트 제목, 이미지, one-line concept, metadata, caption 순으로 위계를 둔다.

---

## 콘텐츠 규칙
- 프로젝트 텍스트는 사용자 제공 텍스트 또는 확인된 포트폴리오/CV 내용을 기준으로 한다.
- 문구를 임의로 “개선”해서 새로운 사실을 만들지 않는다.
- 텍스트가 없으면 placeholder fact를 지어내지 않는다.
- 단, 사용자가 디자인 구현을 먼저 요청한 경우 자료가 없는 프로젝트 때문에 전체 작업을 중단하지 않는다.
- 해당 프로젝트 entry 구조는 만들고, 마지막에 누락 자료 목록만 짧게 보고한다.
- Calibrated Environment는 팀 프로젝트다. Role과 Credits를 정확히 유지한다.
- 팀 작업을 개인 단독 작업처럼 쓰지 않는다.

---

## 이미지 규칙
- 경로: `/images/`
- 권장 파일명: `{번호}-{프로젝트약칭}-{순번}.jpg`
  - 예: `01-fluid-03.jpg`
- 규격: 최장변 2000px 권장.
- JPG quality 70~80 권장.
- 가급적 500KB 이하.
- 규격 밖 파일을 발견하면 보고한다.
- 모든 `img`에 width/height 또는 aspect-ratio를 명시해 CLS를 막는다.
- 첫 화면 밖 이미지는 `loading="lazy"`.
- 첫 화면 핵심 이미지는 eager + `fetchpriority="high"`.
- base64 placeholder를 발견하면 파일 참조로 교체한다.

### 이미지 crop 원칙
이미지 종류를 먼저 판단한다:
- hero rendering
- model photograph
- plan
- section
- elevation
- diagram
- detail drawing
- collage
- process image

일반 원칙:
- 렌더와 모형 사진은 controlled cover crop 가능.
- plan, section, diagram, detail은 정보 손실이 없도록 대부분 전체 비율 유지.
- 타워 이미지는 세로 비율을 억지로 4:3으로 자르지 않는다.
- 모든 이미지에 동일한 `object-fit: cover`를 일괄 적용하지 않는다.
- 이미지 비율을 늘리거나 찌그러뜨리지 않는다.
- 낮은 해상도의 도면을 메인 대형 이미지로 사용하지 않는다.

각 프로젝트 권장 에셋:
- primary thumbnail
- secondary hover image
- hero image
- supporting drawings / diagrams

---

## 프로젝트 데이터 구조
반복 markup보다 data-driven project registry를 우선한다.

각 프로젝트는 최소 다음 정보를 가질 수 있다:

- id
- number
- title
- shortTitle
- tier
- location
- year
- type
- primaryImage
- secondaryImage
- href
- alt

추가 필드는 필요에 따라 확장한다.

한 프로젝트 정보가 여러 HTML 위치에 중복 하드코딩되지 않도록 한다.

---

## 성능 예산
- 모바일 4G 기준 LCP 2.5초 이하 목표.
- 초기 로드 이미지 총량 1.5MB 이하 목표.
- 나머지는 lazy loading.
- Lighthouse Performance / Accessibility 90 이상 목표.
- 예산을 초과하는 인터랙션은 예뻐도 제거한다.
- 성능이 장식보다 우선이다.

---

## 기술 규칙
- 스택: Astro + vanilla CSS + client 동작이 필요한 곳의 vanilla JavaScript.
- React/Preact/Vue/Svelte, Tailwind, GSAP, CMS, UI 라이브러리 도입 금지 (2026-07-10 Astro 마이그레이션 세션에서 확정).
- 추가 프레임워크·번들러 도입은 합의 전 금지.
- 외부 라이브러리는 추가 전에 반드시 물어본다.
- 기본은 no-dependency (Astro core만 의존).
- 커맨드:
  - `npm run dev` — 로컬 개발 서버
  - `npm run build` — 프로덕션 빌드 (`dist/`)
  - `npm run preview` — 프로덕션 빌드 미리보기
- 파일 구조:
  - `src/pages/` — 라우트 (`index.astro`)
  - `src/components/` — `Header.astro`, `Hero.astro`, `LegacyWorkGrid.astro`, `Footer.astro`, `ProjectRooms.astro`
  - `src/layouts/` — `BaseLayout.astro`
  - `src/styles/` — `global.css` (기존 `site.css` 이전, 값 변경 없음)
  - `src/data/` — `portfolio.ts` (포트폴리오 뷰어용 순서 데이터, 뷰어 자체는 미구현)
  - `public/images/` — 이미지 에셋 (기존 `images/` 이전)
  - `public/documents/` — CV/포트폴리오 PDF 저장용 (현재 비어 있음, PDF 미확보)
  - `public/js/site.js` — 기존 인터랙션 로직 그대로 유지 (room open/close, next project, keyboard, clock, filter)
- `LegacyWorkGrid.astro`와 `ProjectRooms.astro`는 임시 구조다. masonry 재설계와 project room 재설계는 각각 별도 세션에서 진행한다.
- 반응형 체크포인트:
  - 390
  - 768
  - 1280
  - 1600px
- 모바일에서 반드시 확인한다.
- 접근성 바닥선:
  - 모든 이미지 alt
  - 키보드 focus visible
  - 필요한 interactive element에 aria 속성
  - hover-only information 금지

---

## Header / Footer

### Header
권장:
- Hyunju Kim 또는 restrained wordmark
- Work
- About
- Resume
- Contact 또는 email

`HK` monogram은 전체 identity system의 일부로 기능할 때만 유지한다.

### Footer
대형 구직 CTA 금지.

다음 정도로 절제한다:
- Resume
- Email
- LinkedIn, 제공된 경우
- Copyright
- Back to top

`Open to junior designer roles in New York`를 가장 큰 문장으로 사용하지 않는다.

Availability 문구는 About 또는 Contact에서 작게 사용할 수 있다.

---

## About Page
포함 가능 정보:
- Architectural Designer based in New York
- Columbia GSAPP M.S. Advanced Architectural Design
- Kookmin University B.Arch
- RMIT exchange study
- LEED AP BD+C
- environmental analysis
- BIM and design development
- material and ecological design interests

전문 경력을 과장하지 않는다.

---

## 작업 방식
- 한 세션에 한 가지 큰 목표.
- 승인 없이 범위를 넓히지 않는다.
- 기존 코드 전면 재작성 금지.
- 수정은 최소 diff로.
- 변경 후 자체 검증.
- 어떤 화면에서 무엇이 바뀌었는지 짧게 보고.
- 커밋은 작업 단위별.
- 커밋 메시지는 영어 명령형.
  - 예: `Refactor project index into tiered grid`

---

## 크레딧 절약 규칙
사용자는 Claude Code 사용량을 최대한 아끼고 싶어 한다.

반드시 지킬 것:

1. 현재 작업과 관련된 파일만 읽는다.
2. repository 전체를 반복해서 inspect하지 않는다.
3. 변경하지 않을 파일을 다시 생성하지 않는다.
4. broad refactor를 기본값으로 선택하지 않는다.
5. 이미 정상 작동하는 component를 이유 없이 재작성하지 않는다.
6. 반복되는 UI는 reusable component 또는 data-driven structure로 만든다.
7. 한 작업이 명확하면 사소한 확인 질문을 하지 말고 진행한다.
8. 질문은 다음 경우에만 한다:
   - 프로젝트의 사실 정보가 꼭 필요한데 없음
   - 이미지 부족이 현재 구현을 실제로 막음
   - 사용자 지시와 CLAUDE.md가 구조적으로 충돌함
9. 사용자의 새 명시적 지시가 구조를 바꾸면 CLAUDE.md를 한 번 업데이트하고 계속 진행한다.
10. 이미 승인된 결정을 다음 세션에서 다시 논쟁하지 않는다.
11. 구현 전 계획은 짧게:
    - 읽을 파일
    - 수정할 파일
    - 만들 component/data structure
    - 구현 순서
12. 구현 후 보고는 짧게:
    - changed files
    - implemented
    - real blockers
13. 긴 디자인 에세이를 쓰지 않는다.
14. missing asset 하나 때문에 전체 작업을 멈추지 않는다.
15. 동일한 질문을 반복하지 않는다.

---

## 현재 승인된 구조적 개정안
이 섹션은 이전 규칙 중 masonry 고정, Ivanpah 제외, Ordinary Village 필터 전용 규칙보다 우선한다.

1. 모든 프로젝트를 사이트에 포함할 수 있다.
2. 강한 프로젝트는 상단 Selected Works에 배치한다.
3. 약하거나 오래된 프로젝트는 하단 More Work / Archive에 배치한다.
4. Selected Works는 프로젝트 단위 entry를 사용한다.
5. 같은 프로젝트를 여러 masonry item으로 반복하지 않는다.
6. Desktop Selected Works는 3-column.
7. Mobile은 1-column.
8. More Work는 낮은 위계의 compact grid.
9. subtle primary-to-secondary image crossfade 허용.
10. random masonry는 더 이상 protected requirement가 아니다.
11. Ivanpah Solar Sanctuary 포함 허용.
12. Spectrum Living 포함.
13. Ordinary Village 포함.
14. 과거 프로젝트 추가 시 CLAUDE.md 재개정 없이 registry에 추가 가능.
15. 프로젝트 페이지 길이는 프로젝트 강도와 자료량에 따라 다르게 간다.

---

## 현재 작업 우선순위
1. homepage/project index 관련 파일만 확인
2. project registry 정리
3. Selected Works 2-column 구현
4. More Work / Archive 구현
5. primary / secondary image 연결
6. desktop 검수
7. mobile 검수
8. individual project page는 다음 단계에서 별도 진행

현재 목표는 사이트 전체를 한 번에 재디자인하는 것이 아니다.

먼저 홈페이지에서:
- 가장 강한 프로젝트가 기억되고
- 모든 프로젝트가 체계적으로 보이고
- 이미지가 주도하며
- 기존 사이트의 좋은 editorial tone을 유지하도록 만든다.

---

## 배포 전 체크리스트
- 깨진 이미지 0
- 콘솔 에러 0
- dead link 0
- Resume link 작동
- Email link 작동
- desktop 확인
- tablet 확인
- mobile 확인
- keyboard focus 확인
- prefers-reduced-motion 확인
- performance budget 확인
