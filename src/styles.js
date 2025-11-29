export const baseStyles = `
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
