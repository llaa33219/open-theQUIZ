import { createQuiz, getQuiz, uploadImage, submitQuiz, getStats } from './api.js';
import { get404Page, getHomePage, getCreatePage, getQuizPage } from './pages/index.js';

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
