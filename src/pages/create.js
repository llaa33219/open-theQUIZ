import { baseStyles } from '../styles.js';

export function getCreatePage() {
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
        <input type="text" class="input" id="quizTitle" placeholder="예: 자바스크립트 문법 맞추기">
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

  <div class="modal" id="successModal" onclick="closeModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-icon">✔️</div>
      <div class="modal-title">퀴즈가 정상적으로<br>생성되었습니다.</div>
      <div class="modal-desc">아래 링크를 복사하여 공유할 수 있습니다.</div>
      <div class="quiz-url" id="quizUrl"></div>
      <button class="btn btn-primary" onclick="copyUrl()" style="width: 100%;">링크 복사하기</button>
      <button class="btn btn-secondary" onclick="closeModal()" style="width: 100%; margin-top: 14px;">닫기</button>
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
          uploadDiv.innerHTML = '';
          const img = document.createElement('img');
          img.src = data.imageUrl;
          img.alt = 'thumbnail';
          uploadDiv.appendChild(img);
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
            const div = document.createElement('div');
            div.className = 'image-item';
            div.draggable = true;
            div.dataset.url = data.imageUrl;
            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.alt = '';
            const numSpan = document.createElement('span');
            numSpan.className = 'img-num';
            numSpan.textContent = idx;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'img-remove';
            removeBtn.textContent = '×';
            removeBtn.onclick = function() { removeImage(this, questionId); };
            div.appendChild(img);
            div.appendChild(numSpan);
            div.appendChild(removeBtn);
            preview.appendChild(div);
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

    function closeModal(event) {
      if (!event || event.target === event.currentTarget) {
        document.getElementById('successModal').classList.remove('active');
      }
    }
  </script>
</body>
</html>`;
}
