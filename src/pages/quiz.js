import { baseStyles } from '../styles.js';
import { escapeHtml } from '../utils.js';

export function getQuizPage(quiz, quizId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(quiz.title)} - open-theQUIZ</title>
  <meta property="og:title" content="${escapeHtml(quiz.title)}">
  <meta property="og:description" content="지금 바로 퀴즈에 도전해보세요!">
  ${quiz.thumbnail ? `<meta property="og:image" content="${escapeHtml(quiz.thumbnail)}">` : ''}
  <style>${baseStyles}
    .intro {
      min-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }
    .intro-card {
      background: var(--white);
      border-radius: var(--radius-lg);
      border: 1px solid var(--gray-200);
      padding: 48px 32px;
      text-align: center;
      max-width: 480px;
      width: 100%;
      box-shadow: var(--shadow-lg);
    }
    .intro-card img {
      max-width: 100%;
      max-height: 240px;
      border-radius: 16px;
      margin-bottom: var(--space-xl);
      border: 1px solid var(--gray-200);
    }
    .intro-card h1 {
      font-size: var(--text-h3);
      font-weight: 700;
      margin-bottom: 12px;
    }
    .intro-card .info {
      color: var(--gray-600);
      margin-bottom: var(--space-xl);
      font-size: var(--text-body);
    }
    .intro-card .start-btn {
      width: 100%;
      padding: 20px;
      font-size: 20px;
      font-weight: 700;
    }
    .quiz-view {
      display: none;
    }
    .progress {
      height: 8px;
      background: var(--gray-200);
      border-radius: 100px;
      margin-bottom: var(--space-xl);
      overflow: hidden;
      margin-top: var(--space-xl);
    }
    .progress-bar {
      height: 100%;
      background: var(--primary-500);
      transition: width 0.3s ease;
    }
    .q-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-xl);
    }
    .q-num {
      font-size: var(--text-h5);
      color: var(--primary-500);
      font-weight: 700;
      margin-bottom: var(--space-md);
    }
    .q-text {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 32px;
      line-height: 1.4;
      word-break: keep-all;
    }
    .q-images {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }
    .q-images img {
      max-height: 240px;
      border-radius: 12px;
      cursor: pointer;
      border: 1px solid var(--gray-200);
      transition: transform 0.2s;
    }
    .q-images img:hover {
      transform: scale(1.02);
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .option-btn {
      background: var(--white);
      border: 2px solid var(--gray-200);
      padding: 16px 20px;
      border-radius: var(--radius-md);
      text-align: left;
      font-size: 18px;
      font-family: var(--font-primary);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
    }
    .option-btn:hover {
      border-color: var(--primary-500);
      box-shadow: 0px 8px 0px var(--primary-500);
      transform: translateY(-8px);
    }
    .option-btn.selected {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      transform: translateY(-4px);
    }
    .option-btn.selected > span {
      color: white !important;
    }
    .nav-btns {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      gap: 16px;
      padding-bottom: 48px;
    }
    .nav-btns .btn {
      flex: 1;
      padding: 16px;
      font-size: 18px;
    }
    .result {
      display: none;
      min-height: 90vh;
      padding: var(--space-xl) 0;
      text-align: center;
    }
    .result-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 48px 32px;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .result-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    .result-title {
      font-size: var(--text-h3);
      font-weight: 700;
      margin-bottom: 32px;
    }
    .score-display {
      font-size: 64px;
      font-weight: 800;
      color: var(--primary-500);
      margin-bottom: 8px;
      line-height: 1;
    }
    .score-detail {
      color: var(--gray-600);
      font-size: var(--text-body);
      margin-bottom: 32px;
    }
    .rank-badge {
      display: inline-block;
      background: var(--gray-900);
      color: white;
      padding: 12px 32px;
      border-radius: 100px;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 40px;
    }
    .share-box {
      border-top: 1px solid var(--gray-200);
      padding-top: 32px;
    }
    .share-box h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .share-url {
      background: var(--gray-50);
      padding: 16px;
      border-radius: 12px;
      font-family: var(--font-mono);
      font-size: 14px;
      margin-bottom: 16px;
      word-break: break-all;
      border: 1px solid var(--gray-300);
      color: var(--gray-600);
    }
    .img-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }
    .img-modal.active {
      display: flex;
    }
    .img-modal img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 8px;
    }
    .img-modal .close {
      position: absolute;
      top: 20px;
      right: 24px;
      color: white;
      font-size: 40px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="intro" id="introScreen">
    <div class="intro-card">
      ${quiz.thumbnail ? `<img src="${escapeHtml(quiz.thumbnail)}" alt="">` : ''}
      <h1>${escapeHtml(quiz.title)}</h1>
      <p class="info">총 ${quiz.questions.length}문제</p>
      <button class="btn btn-primary start-btn" onclick="startQuiz()">시작하기</button>
    </div>
  </div>

  <div class="quiz-view container" id="quizScreen">
    <div class="progress">
      <div class="progress-bar" id="progressBar"></div>
    </div>
    <div class="q-card">
      <div class="q-num" id="qNum"></div>
      <div class="q-text" id="qText"></div>
      <div class="q-images" id="qImages"></div>
      <div class="options" id="options"></div>
    </div>
    <div class="nav-btns">
      <button class="btn btn-secondary" id="prevBtn" onclick="prevQ()">이전</button>
      <button class="btn btn-primary" id="nextBtn" onclick="nextQ()">다음</button>
      <button class="btn btn-primary" id="submitBtn" onclick="submitQuiz()" style="display:none;">제출하기</button>
    </div>
  </div>

  <div class="result" id="resultScreen">
    <div class="result-card">
      <div class="result-icon">🎉</div>
      <div class="result-title">퀴즈 완료!</div>
      <div class="score-display" id="score"></div>
      <div class="score-detail" id="scoreDetail"></div>
      <div class="rank-badge" id="rank"></div>
      <div class="share-box">
        <h4>이 퀴즈 공유하기</h4>
        <div class="share-url" id="shareUrl"></div>
        <button class="btn btn-primary" onclick="copyUrl()" style="width: 100%;">링크 복사</button>
      </div>
    </div>
  </div>

  <div class="img-modal" id="imgModal" onclick="closeModal()">
    <span class="close">&times;</span>
    <img id="modalImg" src="" alt="">
  </div>

  <script>
    const quiz = ${JSON.stringify({ ...quiz, questions: quiz.questions.map(q => ({ ...q, correctAnswer: undefined })) })};
    const quizId = '${quizId}';
    let current = 0;
    const answers = new Array(quiz.questions.length).fill(null);

    function startQuiz() {
      document.getElementById('introScreen').style.display = 'none';
      document.getElementById('quizScreen').style.display = 'block';
      showQ(0);
    }

    function showQ(idx) {
      current = idx;
      const q = quiz.questions[idx];
      const total = quiz.questions.length;

      document.getElementById('progressBar').style.width = ((idx + 1) / total * 100) + '%';
      document.getElementById('qNum').textContent = '문제 ' + (idx + 1) + ' / ' + total;
      document.getElementById('qText').textContent = q.text;

      const imgDiv = document.getElementById('qImages');
      imgDiv.innerHTML = '';
      if (q.images?.length) {
        q.images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.onclick = () => openModal(src);
          imgDiv.appendChild(img);
        });
      }

      const optDiv = document.getElementById('options');
      optDiv.innerHTML = '';
      q.answers.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (answers[idx] === i ? ' selected' : '');
        btn.innerHTML = '<span style="margin-right: 12px; color: var(--primary-500); font-weight:bold;">' + (i + 1) + '</span>' + '<span>' + ans + '</span>';
        btn.onclick = () => selectAnswer(i);
        optDiv.appendChild(btn);
      });

      document.getElementById('prevBtn').disabled = idx === 0;
      document.getElementById('nextBtn').style.display = idx === total - 1 ? 'none' : 'block';
      document.getElementById('submitBtn').style.display = idx === total - 1 ? 'block' : 'none';
    }

    function selectAnswer(i) {
      answers[current] = i;
      showQ(current);
      if (current < quiz.questions.length - 1) {
        setTimeout(() => nextQ(), 250);
      }
    }

    function prevQ() { if (current > 0) showQ(current - 1); }
    function nextQ() { if (current < quiz.questions.length - 1) showQ(current + 1); }

    async function submitQuiz() {
      const empty = answers.findIndex(a => a === null);
      if (empty !== -1) {
        if (!confirm('아직 답하지 않은 문제가 있습니다. 제출하시겠습니까?')) {
          showQ(empty);
          return;
        }
      }

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, answers })
        });
        const data = await res.json();

        if (data.success) {
          document.getElementById('quizScreen').style.display = 'none';
          document.getElementById('resultScreen').style.display = 'block';
          document.getElementById('score').textContent = data.score + '/' + data.total;
          document.getElementById('scoreDetail').textContent = data.total + '문제 중 ' + data.score + '문제 정답';
          document.getElementById('rank').textContent = '상위 ' + data.percentile + '%';
          document.getElementById('shareUrl').textContent = window.location.href;
        }
      } catch (err) {
        alert('제출 중 오류가 발생했습니다.');
      }
    }

    function copyUrl() {
      navigator.clipboard.writeText(window.location.href).then(() => alert('링크가 복사되었습니다!'));
    }

    function openModal(src) {
      document.getElementById('modalImg').src = src;
      document.getElementById('imgModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('imgModal').classList.remove('active');
    }
  </script>
</body>
</html>`;
}
