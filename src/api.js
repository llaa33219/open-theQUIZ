import { generateId, sanitizeString, sanitizeUrl } from './utils.js';

export async function createQuiz(request, env, corsHeaders) {
  const data = await request.json();

  // 먼저 sanitize 적용 후 검증
  const sanitizedTitle = sanitizeString(data.title || '');
  
  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return new Response(JSON.stringify({ error: '퀴즈 제목이 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (sanitizedTitle.length > 200) {
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

  // 문제와 답안도 sanitize 후 검증
  const sanitizedQuestions = [];
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const sanitizedText = sanitizeString(q.text || '');
    
    if (!sanitizedText || sanitizedText.length === 0) {
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
    
    const sanitizedAnswers = q.answers.map(a => sanitizeString(String(a || '')));
    const emptyAnswerIndex = sanitizedAnswers.findIndex(a => !a || a.length === 0);
    if (emptyAnswerIndex !== -1) {
      return new Response(JSON.stringify({ error: `문제 ${i + 1}의 답안 ${emptyAnswerIndex + 1}이 비어있습니다.` }), {
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
    
    sanitizedQuestions.push({
      text: sanitizedText,
      images: Array.isArray(q.images) ? q.images.map(img => sanitizeUrl(img)).filter(Boolean) : [],
      answers: sanitizedAnswers,
      correctAnswer: q.correctAnswer,
    });
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
    title: sanitizedTitle,
    thumbnail: data.thumbnail ? sanitizeUrl(data.thumbnail) : null,
    questions: sanitizedQuestions,
    createdAt: Date.now(),
  };

  await env.QUIZ_KV.put(`quiz:${quizId}`, JSON.stringify(quiz));
  await env.QUIZ_KV.put(`stats:${quizId}`, JSON.stringify({ submissions: [], totalCount: 0 }));

  return new Response(JSON.stringify({ success: true, quizId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function getQuiz(quizId, env, corsHeaders) {
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

export async function uploadImage(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return new Response(JSON.stringify({ error: '파일이 없습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: '허용되지 않는 파일 형식입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return new Response(JSON.stringify({ error: '파일 크기는 10MB 이하여야 합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  const ext = extMap[file.type] || 'jpg';
  const imageId = `${generateId()}_${Date.now()}.${ext}`;

  await env.QUIZ_IMAGES.put(imageId, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return new Response(JSON.stringify({ success: true, imageUrl: `/images/${imageId}` }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function submitQuiz(request, env, corsHeaders) {
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

export async function getStats(quizId, env, corsHeaders) {
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
