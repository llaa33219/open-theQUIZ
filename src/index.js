export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 정적 페이지
      if (path === '/' || path === '/index.html') {
        return new Response(getHomePage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (path === '/create') {
        return new Response(getCreatePage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 퀴즈 페이지 (6자리 코드)
      const quizMatch = path.match(/^\/q\/([a-zA-Z0-9]{6})$/);
      if (quizMatch) {
        const quizId = quizMatch[1];
        const quiz = await env.QUIZ_KV.get(`quiz:${quizId}`, 'json');
        if (!quiz) {
          return new Response('퀴즈를 찾을 수 없습니다.', { status: 404 });
        }
        return new Response(getQuizPage(quiz, quizId), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // API 엔드포인트
      if (path === '/api/quiz' && request.method === 'POST') {
        return await createQuiz(request, env, corsHeaders);
      }

      if (path === '/api/quiz' && request.method === 'GET') {
        const quizId = url.searchParams.get('id');
        return await getQuiz(quizId, env, corsHeaders);
      }

      if (path === '/api/upload' && request.method === 'POST') {
        return await uploadImage(request, env, corsHeaders);
      }

      if (path === '/api/submit' && request.method === 'POST') {
        return await submitQuiz(request, env, corsHeaders);
      }

      if (path === '/api/stats' && request.method === 'GET') {
        const quizId = url.searchParams.get('id');
        return await getStats(quizId, env, corsHeaders);
      }

      // 이미지 서빙
      const imageMatch = path.match(/^\/images\/(.+)$/);
      if (imageMatch) {
        const imageKey = imageMatch[1];
        const image = await env.QUIZ_IMAGES.get(imageKey);
        if (!image) {
          return new Response('이미지를 찾을 수 없습니다.', { status: 404 });
        }
        return new Response(image.body, {
          headers: {
            'Content-Type': image.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 6자리 랜덤 ID 생성
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 퀴즈 생성
async function createQuiz(request, env, corsHeaders) {
  const data = await request.json();

  // 서버 사이드 validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return new Response(JSON.stringify({ error: '퀴즈 제목이 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (data.title.length > 200) {
    return new Response(JSON.stringify({ error: '퀴즈 제목은 200자 이하여야 합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    return new Response(JSON.stringify({ error: '최소 1개의 문제가 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (data.questions.length > 100) {
    return new Response(JSON.stringify({ error: '문제는 최대 100개까지 가능합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
      return new Response(JSON.stringify({ error: `문제 ${i + 1}의 내용이 필요합니다.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      return new Response(JSON.stringify({ error: `문제 ${i + 1}에 최소 2개의 답안이 필요합니다.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (q.answers.length > 20) {
      return new Response(JSON.stringify({ error: `문제 ${i + 1}의 답안은 최대 20개까지 가능합니다.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.answers.length) {
      return new Response(JSON.stringify({ error: `문제 ${i + 1}의 정답이 올바르지 않습니다.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  let quizId;
  let attempts = 0;

  // 중복되지 않는 ID 찾기
  do {
    quizId = generateId();
    const existing = await env.QUIZ_KV.get(`quiz:${quizId}`);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  const quiz = {
    id: quizId,
    title: data.title,
    thumbnail: data.thumbnail || null,
    questions: data.questions,
    createdAt: Date.now(),
  };

  await env.QUIZ_KV.put(`quiz:${quizId}`, JSON.stringify(quiz));
  await env.QUIZ_KV.put(`stats:${quizId}`, JSON.stringify({ submissions: [], totalCount: 0 }));

  return new Response(JSON.stringify({ success: true, quizId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 퀴즈 조회
async function getQuiz(quizId, env, corsHeaders) {
  const quiz = await env.QUIZ_KV.get(`quiz:${quizId}`, 'json');
  if (!quiz) {
    return new Response(JSON.stringify({ error: '퀴즈를 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 정답은 숨김
  const quizWithoutAnswers = {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      correctAnswer: undefined,
    })),
  };

  return new Response(JSON.stringify(quizWithoutAnswers), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 이미지 업로드
async function uploadImage(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return new Response(JSON.stringify({ error: '파일이 없습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const imageId = `${generateId()}_${Date.now()}.${ext}`;

  await env.QUIZ_IMAGES.put(imageId, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return new Response(JSON.stringify({ success: true, imageUrl: `/images/${imageId}` }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 퀴즈 제출
async function submitQuiz(request, env, corsHeaders) {
  const data = await request.json();
  const { quizId, answers } = data;

  const quiz = await env.QUIZ_KV.get(`quiz:${quizId}`, 'json');
  if (!quiz) {
    return new Response(JSON.stringify({ error: '퀴즈를 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 채점
  let correctCount = 0;
  const results = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correctCount++;
    return {
      questionIndex: i,
      userAnswer: answers[i],
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });

  const score = correctCount;
  const total = quiz.questions.length;

  // 통계 업데이트
  let stats = await env.QUIZ_KV.get(`stats:${quizId}`, 'json') || { submissions: [], totalCount: 0 };
  stats.submissions.push(score);
  stats.totalCount++;

  // 상위 1000개만 유지
  if (stats.submissions.length > 1000) {
    stats.submissions = stats.submissions.slice(-1000);
  }

  await env.QUIZ_KV.put(`stats:${quizId}`, JSON.stringify(stats));

  // 상위 % 계산 (높은 점수가 상위)
  const betterCount = stats.submissions.filter((s) => s > score).length;
  const percentile = Math.round(((betterCount + 1) / stats.submissions.length) * 100);

  return new Response(
    JSON.stringify({
      success: true,
      score,
      total,
      percentile,
      results,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// 통계 조회
async function getStats(quizId, env, corsHeaders) {
  const stats = await env.QUIZ_KV.get(`stats:${quizId}`, 'json');
  if (!stats) {
    return new Response(JSON.stringify({ totalCount: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ totalCount: stats.totalCount }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 홈페이지
function getHomePage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>open-theQUIZ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    h1 {
      color: white;
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    p {
      color: rgba(255,255,255,0.9);
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-block;
      padding: 16px 48px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 open-theQUIZ</h1>
    <p>나만의 퀴즈를 만들고 공유하세요!</p>
    <a href="/create" class="btn">퀴즈 만들기</a>
  </div>
</body>
</html>`;
}

// 퀴즈 생성 페이지
function getCreatePage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>퀴즈 만들기 - open-theQUIZ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 30px;
    }
    header h1 {
      color: #667eea;
      font-size: 2rem;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    input[type="text"], textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    .thumbnail-upload {
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .thumbnail-upload:hover {
      border-color: #667eea;
      background: #f8f8ff;
    }
    .thumbnail-upload.has-image {
      padding: 10px;
    }
    .thumbnail-upload img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
    }
    .question-card {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      position: relative;
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .question-number {
      font-weight: 700;
      color: #667eea;
      font-size: 1.1rem;
    }
    .delete-question {
      background: #ff4757;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .image-upload-area {
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin-bottom: 16px;
      cursor: pointer;
    }
    .image-upload-area:hover {
      border-color: #667eea;
    }
    .images-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    .image-item {
      position: relative;
      width: 100px;
      height: 100px;
      cursor: grab;
    }
    .image-item.dragging {
      opacity: 0.5;
    }
    .image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }
    .image-item .image-number {
      position: absolute;
      top: 4px;
      left: 4px;
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .image-item .remove-image {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ff4757;
      color: white;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }
    .answers-section {
      margin-top: 16px;
    }
    .answer-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .answer-item input[type="radio"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .answer-item input[type="text"] {
      flex: 1;
    }
    .answer-item .remove-answer {
      background: #ff4757;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .add-answer {
      background: #f0f0f0;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 10px;
    }
    .add-answer:hover {
      background: #e0e0e0;
    }
    .add-question {
      width: 100%;
      padding: 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .add-question:hover {
      background: #5a6fd6;
    }
    .submit-btn {
      width: 100%;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.3rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .submit-btn:hover {
      transform: scale(1.02);
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    .modal-content h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    .modal-content .quiz-url {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      word-break: break-all;
      margin-bottom: 20px;
      font-family: monospace;
    }
    .copy-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎯 퀴즈 만들기</h1>
    </header>

    <div class="card">
      <div class="form-group">
        <label>퀴즈 제목</label>
        <input type="text" id="quizTitle" placeholder="예: 역사 상식 퀴즈">
      </div>
      <div class="form-group">
        <label>미리보기 이미지 (선택)</label>
        <div class="thumbnail-upload" id="thumbnailUpload">
          <span>클릭하여 이미지 업로드</span>
        </div>
        <input type="file" id="thumbnailInput" accept="image/*" style="display: none;">
      </div>
    </div>

    <div id="questionsContainer"></div>

    <button class="add-question" onclick="addQuestion()">+ 문제 추가</button>

    <button class="submit-btn" onclick="submitQuiz()" id="submitBtn">퀴즈 생성하기</button>
  </div>

  <div class="modal" id="successModal">
    <div class="modal-content">
      <h2>🎉 퀴즈가 생성되었습니다!</h2>
      <p style="margin-bottom: 15px;">아래 링크를 공유하세요:</p>
      <div class="quiz-url" id="quizUrl"></div>
      <button class="copy-btn" onclick="copyUrl()">URL 복사</button>
    </div>
  </div>

  <script>
    let questionCount = 0;
    let thumbnailUrl = null;

    // 초기 문제 추가
    addQuestion();

    // 썸네일 업로드
    document.getElementById('thumbnailUpload').addEventListener('click', () => {
      document.getElementById('thumbnailInput').click();
    });

    document.getElementById('thumbnailInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          thumbnailUrl = data.imageUrl;
          const uploadDiv = document.getElementById('thumbnailUpload');
          uploadDiv.innerHTML = '<img src="' + data.imageUrl + '" alt="thumbnail">';
          uploadDiv.classList.add('has-image');
        }
      } catch (err) {
        alert('이미지 업로드 실패');
      }
    });

    function addQuestion() {
      questionCount++;
      const container = document.getElementById('questionsContainer');
      const questionHtml = \`
        <div class="question-card" id="question-\${questionCount}" data-question-id="\${questionCount}">
          <div class="question-header">
            <span class="question-number">문제 \${questionCount}</span>
            <button class="delete-question" onclick="deleteQuestion(\${questionCount})">삭제</button>
          </div>
          <div class="form-group">
            <label>문제 내용</label>
            <textarea rows="2" placeholder="문제를 입력하세요" class="question-text"></textarea>
          </div>
          <div class="form-group">
            <label>이미지 (선택, 여러개 가능)</label>
            <div class="image-upload-area" onclick="triggerImageUpload(\${questionCount})">
              클릭하여 이미지 추가
            </div>
            <input type="file" class="image-input" accept="image/*" multiple style="display: none;" onchange="handleImageUpload(\${questionCount}, this)">
            <div class="images-preview" id="images-\${questionCount}"></div>
          </div>
          <div class="answers-section">
            <label>답안 (정답 선택)</label>
            <div class="answers-container" id="answers-\${questionCount}">
              <div class="answer-item">
                <input type="radio" name="correct-\${questionCount}" value="0" checked>
                <input type="text" placeholder="답안 1">
                <button class="remove-answer" onclick="removeAnswer(this)">×</button>
              </div>
              <div class="answer-item">
                <input type="radio" name="correct-\${questionCount}" value="1">
                <input type="text" placeholder="답안 2">
                <button class="remove-answer" onclick="removeAnswer(this)">×</button>
              </div>
            </div>
            <button class="add-answer" onclick="addAnswer(\${questionCount})">+ 답안 추가</button>
          </div>
        </div>
      \`;
      container.insertAdjacentHTML('beforeend', questionHtml);
      updateQuestionNumbers();
    }

    function deleteQuestion(id) {
      const question = document.getElementById('question-' + id);
      if (question) {
        question.remove();
        updateQuestionNumbers();
      }
    }

    function updateQuestionNumbers() {
      const questions = document.querySelectorAll('.question-card');
      questions.forEach((q, i) => {
        q.querySelector('.question-number').textContent = '문제 ' + (i + 1);
      });
    }

    function addAnswer(questionId) {
      const container = document.getElementById('answers-' + questionId);
      const answerCount = container.querySelectorAll('.answer-item').length;
      const answerHtml = \`
        <div class="answer-item">
          <input type="radio" name="correct-\${questionId}" value="\${answerCount}">
          <input type="text" placeholder="답안 \${answerCount + 1}">
          <button class="remove-answer" onclick="removeAnswer(this)">×</button>
        </div>
      \`;
      container.insertAdjacentHTML('beforeend', answerHtml);
    }

    function removeAnswer(btn) {
      const answerItem = btn.parentElement;
      const container = answerItem.parentElement;
      if (container.querySelectorAll('.answer-item').length > 2) {
        answerItem.remove();
        // 라디오 값 재정렬
        const answers = container.querySelectorAll('.answer-item');
        answers.forEach((a, i) => {
          a.querySelector('input[type="radio"]').value = i;
        });
      } else {
        alert('최소 2개의 답안이 필요합니다.');
      }
    }

    function triggerImageUpload(questionId) {
      const question = document.getElementById('question-' + questionId);
      question.querySelector('.image-input').click();
    }

    async function handleImageUpload(questionId, input) {
      const files = input.files;
      const previewContainer = document.getElementById('images-' + questionId);

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            const imageIndex = previewContainer.querySelectorAll('.image-item').length + 1;
            const imageHtml = \`
              <div class="image-item" draggable="true" data-url="\${data.imageUrl}">
                <img src="\${data.imageUrl}" alt="">
                <span class="image-number">\${imageIndex}</span>
                <button class="remove-image" onclick="removeImage(this, \${questionId})">×</button>
              </div>
            \`;
            previewContainer.insertAdjacentHTML('beforeend', imageHtml);
            setupDragAndDrop(questionId);
          }
        } catch (err) {
          alert('이미지 업로드 실패');
        }
      }
      input.value = '';
    }

    function removeImage(btn, questionId) {
      btn.parentElement.remove();
      updateImageNumbers(questionId);
    }

    function updateImageNumbers(questionId) {
      const container = document.getElementById('images-' + questionId);
      const images = container.querySelectorAll('.image-item');
      images.forEach((img, i) => {
        img.querySelector('.image-number').textContent = i + 1;
      });
    }

    function setupDragAndDrop(questionId) {
      const container = document.getElementById('images-' + questionId);
      const items = container.querySelectorAll('.image-item');

      items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          updateImageNumbers(questionId);
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          const dragging = container.querySelector('.dragging');
          if (dragging && dragging !== item) {
            const rect = item.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
              container.insertBefore(dragging, item);
            } else {
              container.insertBefore(dragging, item.nextSibling);
            }
          }
        });
      });
    }

    async function submitQuiz() {
      const title = document.getElementById('quizTitle').value.trim();
      if (!title) {
        alert('퀴즈 제목을 입력하세요.');
        return;
      }

      const questionCards = document.querySelectorAll('.question-card');
      if (questionCards.length === 0) {
        alert('최소 1개의 문제가 필요합니다.');
        return;
      }

      const questions = [];
      for (const card of questionCards) {
        const text = card.querySelector('.question-text').value.trim();
        if (!text) {
          alert('모든 문제의 내용을 입력하세요.');
          return;
        }

        const images = [];
        card.querySelectorAll('.image-item').forEach(img => {
          images.push(img.dataset.url);
        });

        const answers = [];
        let correctAnswer = 0;
        let hasEmptyAnswer = false;
        const answerItems = card.querySelectorAll('.answer-item');
        for (let i = 0; i < answerItems.length; i++) {
          const a = answerItems[i];
          const answerText = a.querySelector('input[type="text"]').value.trim();
          if (!answerText) {
            hasEmptyAnswer = true;
            break;
          }
          answers.push(answerText);
          if (a.querySelector('input[type="radio"]').checked) {
            correctAnswer = i;
          }
        }

        if (hasEmptyAnswer) {
          alert('모든 답안을 입력하세요.');
          return;
        }

        if (answers.length < 2) {
          alert('각 문제에 최소 2개의 답안이 필요합니다.');
          return;
        }

        questions.push({
          text,
          images,
          answers,
          correctAnswer
        });
      }

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = '생성 중...';

      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            thumbnail: thumbnailUrl,
            questions
          })
        });
        const data = await res.json();
        if (data.success) {
          const quizUrl = window.location.origin + '/q/' + data.quizId;
          document.getElementById('quizUrl').textContent = quizUrl;
          document.getElementById('successModal').classList.add('active');
        } else {
          alert('퀴즈 생성 실패');
        }
      } catch (err) {
        alert('오류가 발생했습니다.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '퀴즈 생성하기';
      }
    }

    function copyUrl() {
      const url = document.getElementById('quizUrl').textContent;
      navigator.clipboard.writeText(url).then(() => {
        alert('URL이 복사되었습니다!');
      });
    }
  </script>
</body>
</html>`;
}

// 퀴즈 풀기 페이지
function getQuizPage(quiz, quizId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(quiz.title)} - open-theQUIZ</title>
  <meta property="og:title" content="${escapeHtml(quiz.title)}">
  <meta property="og:description" content="open-theQUIZ에서 퀴즈를 풀어보세요!">
  ${quiz.thumbnail ? `<meta property="og:image" content="${escapeHtml(quiz.thumbnail)}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
    }
    .intro-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .intro-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .intro-card img {
      max-width: 100%;
      max-height: 250px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .intro-card h1 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 10px;
    }
    .intro-card p {
      color: #666;
      margin-bottom: 30px;
    }
    .start-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px 48px;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .start-btn:hover {
      transform: scale(1.05);
    }
    .quiz-screen {
      display: none;
      padding: 20px;
      max-width: 700px;
      margin: 0 auto;
    }
    .progress-bar {
      background: #e0e0e0;
      border-radius: 10px;
      height: 8px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      height: 100%;
      transition: width 0.3s;
    }
    .question-container {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .question-number {
      color: #667eea;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .question-text {
      font-size: 1.3rem;
      color: #333;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .question-images {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }
    .question-images img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      cursor: pointer;
    }
    .answers {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .answer-btn {
      background: #f5f5f5;
      border: 2px solid #e0e0e0;
      padding: 16px 20px;
      border-radius: 12px;
      text-align: left;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .answer-btn:hover {
      border-color: #667eea;
      background: #f8f8ff;
    }
    .answer-btn.selected {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }
    .nav-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .submit-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 14px 40px;
    }
    .result-screen {
      display: none;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .result-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .result-card h2 {
      color: #667eea;
      font-size: 2rem;
      margin-bottom: 20px;
    }
    .score {
      font-size: 4rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }
    .score-detail {
      color: #666;
      font-size: 1.2rem;
      margin-bottom: 20px;
    }
    .percentile {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 1.2rem;
      margin-bottom: 30px;
      display: inline-block;
    }
    .share-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 30px;
      margin-top: 20px;
    }
    .share-section h3 {
      color: #333;
      margin-bottom: 15px;
    }
    .share-url {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      word-break: break-all;
      margin-bottom: 15px;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .copy-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }
    .image-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .image-modal.active {
      display: flex;
    }
    .image-modal img {
      max-width: 90%;
      max-height: 90%;
    }
    .image-modal .close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 2rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="intro-screen" id="introScreen">
    <div class="intro-card">
      ${quiz.thumbnail ? `<img src="${escapeHtml(quiz.thumbnail)}" alt="">` : ''}
      <h1>${escapeHtml(quiz.title)}</h1>
      <p>총 ${quiz.questions.length}문제</p>
      <button class="start-btn" onclick="startQuiz()">퀴즈 풀기</button>
    </div>
  </div>

  <div class="quiz-screen" id="quizScreen">
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill"></div>
    </div>
    <div class="question-container">
      <div class="question-number" id="questionNumber"></div>
      <div class="question-text" id="questionText"></div>
      <div class="question-images" id="questionImages"></div>
      <div class="answers" id="answers"></div>
    </div>
    <div class="nav-buttons">
      <button class="nav-btn" id="prevBtn" onclick="prevQuestion()">이전</button>
      <button class="nav-btn" id="nextBtn" onclick="nextQuestion()">다음</button>
      <button class="nav-btn submit-btn" id="submitQuizBtn" onclick="submitQuiz()" style="display:none;">답안 제출</button>
    </div>
  </div>

  <div class="result-screen" id="resultScreen">
    <div class="result-card">
      <h2>🎉 퀴즈 완료!</h2>
      <div class="score" id="score"></div>
      <div class="score-detail" id="scoreDetail"></div>
      <div class="percentile" id="percentile"></div>
      <div class="share-section">
        <h3>이 퀴즈 공유하기</h3>
        <div class="share-url" id="shareUrl"></div>
        <button class="copy-btn" onclick="copyShareUrl()">URL 복사</button>
      </div>
    </div>
  </div>

  <div class="image-modal" id="imageModal" onclick="closeImageModal()">
    <span class="close">&times;</span>
    <img id="modalImage" src="" alt="">
  </div>

  <script>
    const quizData = ${JSON.stringify({ ...quiz, questions: quiz.questions.map(q => ({ ...q, correctAnswer: undefined })) })};
    const quizId = '${quizId}';
    let currentQuestion = 0;
    const userAnswers = new Array(quizData.questions.length).fill(null);

    function startQuiz() {
      document.getElementById('introScreen').style.display = 'none';
      document.getElementById('quizScreen').style.display = 'block';
      showQuestion(0);
    }

    function showQuestion(index) {
      currentQuestion = index;
      const question = quizData.questions[index];
      const total = quizData.questions.length;

      document.getElementById('progressFill').style.width = ((index + 1) / total * 100) + '%';
      document.getElementById('questionNumber').textContent = '문제 ' + (index + 1) + ' / ' + total;
      document.getElementById('questionText').textContent = question.text;

      // 이미지
      const imagesDiv = document.getElementById('questionImages');
      imagesDiv.innerHTML = '';
      if (question.images && question.images.length > 0) {
        question.images.forEach(img => {
          const imgEl = document.createElement('img');
          imgEl.src = img;
          imgEl.onclick = () => openImageModal(img);
          imagesDiv.appendChild(imgEl);
        });
      }

      // 답안
      const answersDiv = document.getElementById('answers');
      answersDiv.innerHTML = '';
      question.answers.forEach((answer, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn' + (userAnswers[index] === i ? ' selected' : '');
        btn.textContent = (i + 1) + ') ' + answer;
        btn.onclick = () => selectAnswer(i);
        answersDiv.appendChild(btn);
      });

      // 네비게이션
      document.getElementById('prevBtn').disabled = index === 0;
      if (index === total - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitQuizBtn').style.display = 'inline-block';
      } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('submitQuizBtn').style.display = 'none';
      }
    }

    function selectAnswer(answerIndex) {
      userAnswers[currentQuestion] = answerIndex;
      showQuestion(currentQuestion);

      // 자동 다음 문제
      if (currentQuestion < quizData.questions.length - 1) {
        setTimeout(() => {
          nextQuestion();
        }, 300);
      }
    }

    function prevQuestion() {
      if (currentQuestion > 0) {
        showQuestion(currentQuestion - 1);
      }
    }

    function nextQuestion() {
      if (currentQuestion < quizData.questions.length - 1) {
        showQuestion(currentQuestion + 1);
      }
    }

    async function submitQuiz() {
      const unanswered = userAnswers.findIndex(a => a === null);
      if (unanswered !== -1) {
        if (!confirm('아직 답하지 않은 문제가 있습니다. 그래도 제출하시겠습니까?')) {
          showQuestion(unanswered);
          return;
        }
      }

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: quizId,
            answers: userAnswers
          })
        });
        const data = await res.json();

        if (data.success) {
          document.getElementById('quizScreen').style.display = 'none';
          document.getElementById('resultScreen').style.display = 'block';

          document.getElementById('score').textContent = data.score + '/' + data.total;
          document.getElementById('scoreDetail').textContent = '총 ' + data.total + '문제 중 ' + data.score + '문제 정답';
          document.getElementById('percentile').textContent = '상위 ' + data.percentile + '%';
          document.getElementById('shareUrl').textContent = window.location.href;
        }
      } catch (err) {
        alert('제출 중 오류가 발생했습니다.');
      }
    }

    function copyShareUrl() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('URL이 복사되었습니다!');
      });
    }

    function openImageModal(src) {
      document.getElementById('modalImage').src = src;
      document.getElementById('imageModal').classList.add('active');
    }

    function closeImageModal() {
      document.getElementById('imageModal').classList.remove('active');
    }
  </script>
</body>
</html>`;
}
