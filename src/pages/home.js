import { baseStyles } from '../styles.js';

export function getHomePage() {
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
    .hero-img {
      max-width: 200px;
      max-height: 200px;
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
    <img class="hero-img" src="https://img.bloupla.net/XSoiB9bU?raw=1">
    <h1 class="hero-title">open-theQUIZ</h1>
    <p class="hero-subtitle">퀴즈 공유 사이트</p>
    
    <a href="/create" class="btn btn-primary" style="font-size: 24px; padding: 16px 48px;">
      퀴즈 만들기
    </a>
  </div>
</body>
</html>`;
}
