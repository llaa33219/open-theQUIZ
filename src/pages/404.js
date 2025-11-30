import { baseStyles } from '../styles.js';
import { translations, languages, defaultLang, getLangSelectorStyles, getLangScript } from '../i18n.js';

export function get404Page(lang = defaultLang) {
  const t = translations[lang] || translations[defaultLang];
  
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="https://img.bloupla.net/XSoiB9bU?raw=1" type="image/png">
  <title>${t.notFoundTitle} - open-theQUIZ</title>
  <style>${baseStyles}
    ${getLangSelectorStyles()}
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
  <div class="lang-selector">
    <select id="langSelect" onchange="changeLang(this.value)">
      ${languages.map(l => `<option value="${l.code}" ${l.code === lang ? 'selected' : ''}>${l.flag} ${l.name}</option>`).join('')}
    </select>
  </div>

  <div class="container error-page">
    <div class="card error-card static">
      <div class="error-icon">💀</div>
      <h1 class="error-title">404</h1>
      <p style="margin-bottom: var(--space-xl); color: var(--gray-600);">${t.notFoundDesc}</p>
      <a href="/?lang=${lang}" class="btn btn-primary">${t.backToHomeBtn}</a>
    </div>
  </div>

  <script>
    ${getLangScript()}
  </script>
</body>
</html>`;
}
