import { baseStyles } from '../styles.js';

export function get404Page() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="https://img.bloupla.net/XSoiB9bU?raw=1" type="image/png">
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
      <p style="margin-bottom: var(--space-xl); color: var(--gray-600);">잘못된 주소 또는 삭제된 퀴즈입니다.</p>
      <a href="/" class="btn btn-primary">홈으로 돌아가기</a>
    </div>
  </div>
</body>
</html>`;
}
