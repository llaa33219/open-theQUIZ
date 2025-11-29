export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

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

      // 퀴즈 페이지 - /q/:id 또는 /:id 둘 다 지원
      const quizMatchLong = path.match(/^\/q\/([a-zA-Z0-9]{6})$/);
      const quizMatchShort = path.match(/^\/([a-zA-Z0-9]{6})$/);
      const quizMatch = quizMatchLong || quizMatchShort;
      
      if (quizMatch) {
        const quizId = quizMatch[1];
        const quiz = await env.QUIZ_KV.get(`quiz:${quizId}`, 'json');
        if (!quiz) {
          return new Response(get404Page(), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        return new Response(getQuizPage(quiz, quizId), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      return new Response(get404Page(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createQuiz(request, env, corsHeaders) {
  const data = await request.json();

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

async function getQuiz(quizId, env, corsHeaders) {
  const quiz = await env.QUIZ_KV.get(`quiz:${quizId}`, 'json');
  if (!quiz) {
    return new Response(JSON.stringify({ error: '퀴즈를 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

  let stats = await env.QUIZ_KV.get(`stats:${quizId}`, 'json') || { submissions: [], totalCount: 0 };
  stats.submissions.push(score);
  stats.totalCount++;

  if (stats.submissions.length > 1000) {
    stats.submissions = stats.submissions.slice(-1000);
  }

  await env.QUIZ_KV.put(`stats:${quizId}`, JSON.stringify(stats));

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

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Code:wght@400;500;600;700&display=swap');
  @font-face {
    font-family: 'CloudSansCode';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/goorm-sans-code.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    /* Colors */
    --primary-50: #eef6ff;
    --primary-500: #007BFF;
    --primary-600: #005BDD;
    --primary-700: #193694;

    --secondary-500: #00d200;
    
    --white: #ffffff;
    --gray-50: #fafafa;
    --gray-100: #f5f5f5;
    --gray-200: #e8e8e8;
    --gray-300: #d6d6d6;
    --gray-400: #a6a6a6;
    --gray-600: #575757;
    --gray-900: #1c1c1c;
    
    --error: #df0013;

    /* Typography */
    --font-primary: "CloudSansCode", -apple-system, sans-serif;
    --font-mono: 'Google Sans Code', monospace;
    
    --text-display: 72px;
    --text-h1: 56px;
    --text-h2: 36px;
    --text-h3: 28px;
    --text-h4: 24px;
    --text-h5: 20px;
    --text-body-lg: 30px;
    --text-body: 22px;
    --text-body-sm: 16px;

    /* Spacing */
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    --space-3xl: 64px;
    
    /* Shadows */
    --shadow-xs: 8px 8px 0px rgba(0,0,0,0.2);
    --shadow-sm: 2px 2px 0px rgba(0,0,0,0.2);
    --shadow-lg: 10px 10px 0px rgba(0,0,0,0.2);
    --shadow-xl: 20px 20px 0px rgba(0,0,0,0.2);
    
    /* Radius */
    --radius-md: 20px;
    --radius-lg: 26px;
    
    --container-max-width: 800px;
  }

  body {
    font-family: var(--font-primary);
    background: var(--gray-50);
    color: var(--gray-900);
    line-height: 1.5;
    min-height: 100vh;
  }

  .container {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--space-xl);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: var(--text-body);
    font-family: var(--font-primary);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    gap: var(--space-sm);
  }

  .btn-primary {
    background: var(--primary-500);
    color: var(--white);
    box-shadow: var(--shadow-xs);
  }
  .btn-primary:hover {
    background: var(--primary-600);
    box-shadow: var(--shadow-sm);
    transform: translateY(6px);
  }
  .btn-primary:active {
    background: var(--primary-700);
    transform: translateY(8px);
    box-shadow: none;
  }
  .btn-primary:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }

  .btn-secondary {
    background: transparent;
    color: var(--primary-500);
    border: 2px solid var(--primary-500);
    padding: 10px 22px;
  }
  .btn-secondary:hover {
    box-shadow: var(--shadow-xs);
    transform: translateY(-8px);
  }

  /* Cards */
  .card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    box-shadow: var(--shadow-sm);
    transition: all 0.5s ease;
  }
  .card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-10px);
  }
  .card.static:hover {
     box-shadow: var(--shadow-sm);
     transform: none;
  }

  /* Inputs */
  .input, textarea, select {
    width: 100%;
    padding: 12px 16px;
    background: var(--white);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    font-size: var(--text-body);
    font-family: var(--font-primary);
    color: var(--gray-900);
    transition: all 0.3s ease;
  }
  .input:focus, textarea:focus, select:focus {
    outline: none;
    box-shadow: var(--shadow-xs);
    transform: translateY(-8px);
  }
  .input::placeholder { color: var(--gray-400); }
  
  label {
    display: block;
    font-size: var(--text-body);
    font-weight: 600;
    margin-bottom: var(--space-sm);
    color: var(--gray-900);
  }
  .form-group { margin-bottom: var(--space-lg); }
  
  /* Responsive */
  @media (max-width: 640px) {
    :root {
      --text-h1: 36px;
      --text-h2: 28px;
      --text-body: 18px;
      --space-xl: 16px;
    }
    .container { padding: 0 16px; }
  }
`;

function get404Page() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지를 찾을 수 없습니다 - open-theQUIZ</title>
  <style>${baseStyles}
    .error-page {
      min-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .error-card {
      max-width: 500px;
      width: 100%;
      margin: 0 auto;
    }
    .error-icon {
      font-size: 80px;
      margin-bottom: var(--space-lg);
    }
    .error-title {
      font-size: var(--text-h2);
      margin-bottom: var(--space-md);
    }
  </style>
</head>
<body>
  <div class="container error-page">
    <div class="card error-card static">
      <div class="error-icon">💀</div>
      <h1 class="error-title">404</h1>
      <p style="margin-bottom: var(--space-xl); color: var(--gray-600);">잘못된 주소 또는 삭제된 퀴즈입니다./p>
      <a href="/" class="btn btn-primary">홈으로 돌아가기</a>
    </div>
  </div>
</body>
</html>`;
}

function getHomePage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>open-theQUIZ</title>
  <style>${baseStyles}
    .hero {
        min-height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--space-3xl) var(--space-xl);
    }
    .logo-area {
        margin-bottom: var(--space-xl);
        font-size: var(--text-display);
        font-weight: 800;
        color: var(--primary-500);
        text-shadow: 4px 4px 0px var(--gray-900);
        line-height: 1;
    }
    .hero-title {
        font-size: var(--text-h1);
        font-weight: 700;
        margin-bottom: var(--space-md);
        line-height: 1.1;
    }
    .hero-subtitle {
        font-size: var(--text-body-lg);
        color: var(--gray-600);
        margin-bottom: var(--space-2xl);
        max-width: 600px;
    }
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-xl);
        width: 100%;
        max-width: var(--container-max-width);
        margin-top: var(--space-3xl);
    }
    .feature-card {
        text-align: center;
    }
    .feature-icon {
        font-size: 48px;
        margin-bottom: var(--space-md);
    }
    .feature-title {
        font-size: var(--text-h3);
        font-weight: 600;
        margin-bottom: var(--space-sm);
    }
    .feature-desc {
        font-size: var(--text-body);
        color: var(--gray-600);
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1 class="hero-title">open-theQUIZ</h1>
    <p class="hero-subtitle">퀴즈 공유 사이트</p>
    
    <a href="/create" class="btn btn-primary" style="font-size: 24px; padding: 16px 48px;">
      퀴즈 만들기
    </a>
  </div>
</body>
</html>`;
}

function getCreatePage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>퀴즈 만들기 - open-theQUIZ</title>
  <style>${baseStyles}
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 0;
      margin-bottom: var(--space-xl);
    }
    .header-title {
      font-size: var(--text-h4);
      font-weight: 600;
    }
    .back-link {
      color: var(--gray-600);
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
    }
    .back-link:hover {
      color: var(--primary-500);
    }
    .section-title {
      font-size: var(--text-h5);
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: var(--space-md);
      margin-top: var(--space-lg);
    }
    .thumbnail-upload {
      border: 2px dashed var(--gray-300);
      border-radius: var(--radius-md);
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
      color: var(--gray-600);
      background: var(--gray-50);
    }
    .thumbnail-upload:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
      background: var(--primary-50);
    }
    .thumbnail-upload.has-image {
      padding: 8px;
      border-style: solid;
    }
    .thumbnail-upload img {
      max-width: 100%;
      max-height: 160px;
      border-radius: 12px;
    }
    .question-card {
      margin-bottom: var(--space-lg);
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .question-num {
      font-weight: 700;
      color: var(--primary-500);
      font-size: var(--text-h5);
    }
    .delete-btn {
      background: none;
      border: none;
      color: var(--gray-500);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .delete-btn:hover {
      color: var(--error);
    }
    .image-area {
      border: 2px dashed var(--gray-300);
      border-radius: var(--radius-md);
      padding: 16px;
      text-align: center;
      cursor: pointer;
      margin-bottom: 16px;
      font-size: 14px;
      color: var(--gray-600);
      background: var(--gray-50);
    }
    .image-area:hover {
      border-color: var(--primary-500);
      background: var(--primary-50);
    }
    .images-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .image-item {
      position: relative;
      width: 80px;
      height: 80px;
      cursor: grab;
    }
    .image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .image-item .img-num {
      position: absolute;
      top: -6px;
      left: -6px;
      background: var(--primary-500);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .image-item .img-remove {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--error);
      color: white;
      border: 2px solid white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .answer-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .answer-item input[type="radio"] {
      width: 24px;
      height: 24px;
      accent-color: var(--primary-500);
    }
    .answer-item input[type="text"] {
      flex: 1;
    }
    .answer-item .remove-answer {
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      padding: 4px;
      font-size: 24px;
    }
    .answer-item .remove-answer:hover {
      color: var(--error);
    }
    .add-btn {
      background: var(--white);
      border: 2px dashed var(--gray-300);
      color: var(--gray-600);
      width: 100%;
      padding: 12px;
      margin-top: 8px;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
    }
    .add-btn:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
    }
    .add-question-btn {
      width: 100%;
      padding: 16px;
      margin-bottom: 24px;
      background: var(--white);
      border: 2px dashed var(--gray-300);
      color: var(--gray-600);
      border-radius: var(--radius-md);
      font-size: 18px;
      font-weight: 600;
    }
    .add-question-btn:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
    }
    .submit-btn {
      width: 100%;
      padding: 20px;
      font-size: 20px;
      font-weight: 700;
    }
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 1000;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      background: var(--white);
      border-radius: var(--radius-lg);
      padding: 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--gray-200);
    }
    .modal-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .modal-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .modal-desc {
      color: var(--gray-600);
      margin-bottom: 24px;
      font-size: 16px;
    }
    .quiz-url {
      background: var(--gray-50);
      padding: 12px 16px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 14px;
      word-break: break-all;
      margin-bottom: 16px;
      border: 1px solid var(--gray-300);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="/" class="back-link">← 홈으로</a>
      <span class="header-title">퀴즈 만들기</span>
      <span style="width: 60px;"></span>
    </div>

    <div class="card static" style="margin-bottom: 24px;">
      <div class="section-title" style="margin-top:0">기본 정보</div>
      <div class="form-group">
        <label>퀴즈 제목</label>
        <input type="text" class="input" id="quizTitle" placeholder="예: 자바스크립트 문법 맞추기>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>썸네일 이미지 (선택)</label>
        <div class="thumbnail-upload" id="thumbnailUpload">
          <span>클릭하여 이미지 업로드</span>
        </div>
        <input type="file" id="thumbnailInput" accept="image/*" style="display: none;">
      </div>
    </div>

    <div class="section-title">문제 목록</div>
    <div id="questionsContainer"></div>

    <button class="btn add-question-btn" onclick="addQuestion()">+ 문제 추가하기</button>
    <button class="btn btn-primary submit-btn" onclick="submitQuiz()" id="submitBtn">퀴즈 생성하기</button>
  </div>

  <div class="modal" id="successModal">
    <div class="modal-content">
      <div class="modal-icon">✔️</div>
      <div class="modal-title">퀴즈가 정상적으로 생성되었습니다.</div>
      <div class="modal-desc">아래 링크를 복사하여 공유할 수 있습니다.</div>
      <div class="quiz-url" id="quizUrl"></div>
      <button class="btn btn-primary" onclick="copyUrl()" style="width: 100%;">링크 복사하기</button>
    </div>
  </div>

  <script>
    let questionCount = 0;
    let thumbnailUrl = null;

    addQuestion();

    document.getElementById('thumbnailUpload').addEventListener('click', () => {
      document.getElementById('thumbnailInput').click();
    });

    document.getElementById('thumbnailInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
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
      const html = \`
        <div class="card static question-card" id="question-\${questionCount}">
          <div class="question-header">
            <span class="question-num">문제 \${questionCount}</span>
            <button class="delete-btn" onclick="deleteQuestion(\${questionCount})">삭제</button>
          </div>
          <div class="form-group">
            <label>문제 내용</label>
            <textarea class="input question-text" rows="2" placeholder="문제를 입력하세요"></textarea>
          </div>
          <div class="form-group">
            <label>이미지 (선택)</label>
            <div class="image-area" onclick="triggerImageUpload(\${questionCount})">클릭하여 이미지 추가</div>
            <input type="file" class="image-input" accept="image/*" multiple style="display: none;" onchange="handleImageUpload(\${questionCount}, this)">
            <div class="images-preview" id="images-\${questionCount}"></div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>답안 (정답을 선택하세요)</label>
            <div class="answers-container" id="answers-\${questionCount}">
              <div class="answer-item">
                <input type="radio" name="correct-\${questionCount}" value="0" checked>
                <input type="text" class="input" placeholder="답안 1">
                <button class="remove-answer" onclick="removeAnswer(this)">×</button>
              </div>
              <div class="answer-item">
                <input type="radio" name="correct-\${questionCount}" value="1">
                <input type="text" class="input" placeholder="답안 2">
                <button class="remove-answer" onclick="removeAnswer(this)">×</button>
              </div>
            </div>
            <button class="btn add-btn" onclick="addAnswer(\${questionCount})">+ 답안 추가</button>
          </div>
        </div>
      \`;
      container.insertAdjacentHTML('beforeend', html);
      updateQuestionNumbers();
    }

    function deleteQuestion(id) {
      document.getElementById('question-' + id)?.remove();
      updateQuestionNumbers();
    }

    function updateQuestionNumbers() {
      document.querySelectorAll('.question-card').forEach((q, i) => {
        q.querySelector('.question-num').textContent = '문제 ' + (i + 1);
      });
    }

    function addAnswer(questionId) {
      const container = document.getElementById('answers-' + questionId);
      const count = container.querySelectorAll('.answer-item').length;
      const html = \`
        <div class="answer-item">
          <input type="radio" name="correct-\${questionId}" value="\${count}">
          <input type="text" class="input" placeholder="답안 \${count + 1}">
          <button class="remove-answer" onclick="removeAnswer(this)">×</button>
        </div>
      \`;
      container.insertAdjacentHTML('beforeend', html);
    }

    function removeAnswer(btn) {
      const container = btn.parentElement.parentElement;
      if (container.querySelectorAll('.answer-item').length > 2) {
        btn.parentElement.remove();
        container.querySelectorAll('.answer-item').forEach((a, i) => {
          a.querySelector('input[type="radio"]').value = i;
        });
      } else {
        alert('최소 2개의 답안이 필요합니다.');
      }
    }

    function triggerImageUpload(questionId) {
      document.getElementById('question-' + questionId).querySelector('.image-input').click();
    }

    async function handleImageUpload(questionId, input) {
      const files = input.files;
      const preview = document.getElementById('images-' + questionId);

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
            const idx = preview.querySelectorAll('.image-item').length + 1;
            const html = \`
              <div class="image-item" draggable="true" data-url="\${data.imageUrl}">
                <img src="\${data.imageUrl}" alt="">
                <span class="img-num">\${idx}</span>
                <button class="img-remove" onclick="removeImage(this, \${questionId})">×</button>
              </div>
            \`;
            preview.insertAdjacentHTML('beforeend', html);
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
      document.getElementById('images-' + questionId).querySelectorAll('.image-item').forEach((img, i) => {
        img.querySelector('.img-num').textContent = i + 1;
      });
    }

    function setupDragAndDrop(questionId) {
      const container = document.getElementById('images-' + questionId);
      container.querySelectorAll('.image-item').forEach(item => {
        item.ondragstart = () => item.classList.add('dragging');
        item.ondragend = () => { item.classList.remove('dragging'); updateImageNumbers(questionId); };
        item.ondragover = (e) => {
          e.preventDefault();
          const dragging = container.querySelector('.dragging');
          if (dragging && dragging !== item) {
            const rect = item.getBoundingClientRect();
            if (e.clientX < rect.left + rect.width / 2) {
              container.insertBefore(dragging, item);
            } else {
              container.insertBefore(dragging, item.nextSibling);
            }
          }
        };
      });
    }

    async function submitQuiz() {
      const title = document.getElementById('quizTitle').value.trim();
      if (!title) { alert('퀴즈 제목을 입력하세요.'); return; }

      const cards = document.querySelectorAll('.question-card');
      if (cards.length === 0) { alert('최소 1개의 문제가 필요합니다.'); return; }

      const questions = [];
      for (const card of cards) {
        const text = card.querySelector('.question-text').value.trim();
        if (!text) { alert('모든 문제의 내용을 입력하세요.'); return; }

        const images = [];
        card.querySelectorAll('.image-item').forEach(img => images.push(img.dataset.url));

        const answers = [];
        let correctAnswer = 0;
        let hasEmpty = false;
        const items = card.querySelectorAll('.answer-item');
        for (let i = 0; i < items.length; i++) {
          const txt = items[i].querySelector('input[type="text"]').value.trim();
          if (!txt) { hasEmpty = true; break; }
          answers.push(txt);
          if (items[i].querySelector('input[type="radio"]').checked) correctAnswer = i;
        }

        if (hasEmpty) { alert('모든 답안을 입력하세요.'); return; }
        if (answers.length < 2) { alert('각 문제에 최소 2개의 답안이 필요합니다.'); return; }

        questions.push({ text, images, answers, correctAnswer });
      }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = '생성 중...';

      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, thumbnail: thumbnailUrl, questions })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('quizUrl').textContent = window.location.origin + '/' + data.quizId;
          document.getElementById('successModal').classList.add('active');
        } else {
          alert(data.error || '퀴즈 생성 실패');
        }
      } catch (err) {
        alert('오류가 발생했습니다.');
      } finally {
        btn.disabled = false;
        btn.textContent = '퀴즈 생성하기';
      }
    }

    function copyUrl() {
      navigator.clipboard.writeText(document.getElementById('quizUrl').textContent).then(() => {
        alert('링크가 복사되었습니다!');
      });
    }
  </script>
</body>
</html>`;
}

function getQuizPage(quiz, quizId) {
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
      box-shadow: 8px 8px 0px var(--primary-500);
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
      color: white;
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
