// ===========================================================================
// 의견 보내기 — 우측 하단 플로팅 버튼 + 모달, Supabase feedback 테이블에 저장
// 게스트도 보낼 수 있고, 로그인 사용자는 user_id/이메일이 자동으로 첨부됩니다.
// ===========================================================================
(function () {
  const MAX_LEN = 2000;
  const CATEGORIES = [
    { value: 'general', label: '일반 의견' },
    { value: 'bug', label: '버그 신고' },
    { value: 'feature', label: '기능 제안' },
    { value: 'data', label: '데이터 오류 (점수·환산)' },
  ];

  let modal = null; // 한 번만 생성해서 재사용

  function buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'fb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'fbTitle');

    const options = CATEGORIES.map(
      c => `<option value="${c.value}">${c.label}</option>`
    ).join('');

    overlay.innerHTML =
      '<div class="fb-modal">' +
        '<div class="fb-head">' +
          '<h3 id="fbTitle">의견 보내기</h3>' +
          '<button class="fb-close" type="button" aria-label="닫기">×</button>' +
        '</div>' +
        '<p class="fb-desc">불편한 점, 잘못된 데이터, 추가했으면 하는 기능 무엇이든 편하게 남겨주세요. 직접 읽고 반영합니다.</p>' +
        '<div class="fb-field">' +
          '<label for="fbCategory">분류</label>' +
          '<select id="fbCategory" class="log-select">' + options + '</select>' +
        '</div>' +
        '<div class="fb-field">' +
          '<label for="fbMessage">내용</label>' +
          '<textarea id="fbMessage" class="fb-textarea" rows="5" maxlength="' + MAX_LEN + '" placeholder="여기에 의견을 적어주세요"></textarea>' +
          '<div class="fb-count"><span id="fbCount">0</span> / ' + MAX_LEN + '</div>' +
        '</div>' +
        '<div class="fb-field">' +
          '<label for="fbEmail">답변 받을 이메일 <span class="fb-optional">(선택)</span></label>' +
          '<input type="email" id="fbEmail" class="log-memo" placeholder="답변이 필요하면 적어주세요" autocomplete="email" />' +
        '</div>' +
        '<div class="fb-actions">' +
          '<button class="btn-secondary" type="button" id="fbCancel">취소</button>' +
          '<button class="btn-primary" type="button" id="fbSubmit">보내기</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.fb-close');
    const cancelBtn = overlay.querySelector('#fbCancel');
    const submitBtn = overlay.querySelector('#fbSubmit');
    const messageEl = overlay.querySelector('#fbMessage');
    const emailEl = overlay.querySelector('#fbEmail');
    const countEl = overlay.querySelector('#fbCount');

    messageEl.addEventListener('input', () => {
      countEl.textContent = String(messageEl.value.length);
    });

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
    submitBtn.addEventListener('click', () => submit(overlay, submitBtn, messageEl, emailEl));

    return overlay;
  }

  function openModal() {
    if (!modal) modal = buildModal();
    // 로그인 사용자면 이메일 미리 채우기
    const emailEl = modal.querySelector('#fbEmail');
    if (!emailEl.value && typeof currentUser !== 'undefined' && currentUser && currentUser.email) {
      emailEl.value = currentUser.email;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('#fbMessage').focus(), 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  async function submit(overlay, submitBtn, messageEl, emailEl) {
    const message = messageEl.value.trim();
    const email = emailEl.value.trim();
    const category = overlay.querySelector('#fbCategory').value;

    if (message.length < 5) {
      toast('내용을 5자 이상 적어주세요.', { type: 'error' });
      messageEl.focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('이메일 형식이 올바르지 않아요.', { type: 'error' });
      emailEl.focus();
      return;
    }

    submitBtn.disabled = true;
    const prevLabel = submitBtn.textContent;
    submitBtn.textContent = '보내는 중...';

    try {
      const payload = {
        category,
        message,
        email: email || null,
        user_id: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null,
        page: location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
      };
      const { error } = await supabaseClient.from('feedback').insert(payload);
      if (error) throw error;

      // 성공
      messageEl.value = '';
      overlay.querySelector('#fbCount').textContent = '0';
      closeModal();
      toast('소중한 의견 감사합니다! 잘 전달됐어요.', { type: 'success' });
    } catch (e) {
      console.error('feedback submit error:', e);
      toast('전송에 실패했어요. 잠시 후 다시 시도해주세요.', { type: 'error' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  }

  function buildFab() {
    const btn = document.createElement('button');
    btn.className = 'fb-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', '의견 보내기');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/>' +
      '</svg>' +
      '<span class="fb-fab-label">의견</span>';
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFab);
  } else {
    buildFab();
  }
})();
