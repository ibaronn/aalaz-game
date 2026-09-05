/* ============================================================
   العاز — منطق اللعبة الكامل
   الشاشات · الحروف المبعثرة · التحقق · التلميحات · حفظ التقدم
   ============================================================ */
(function () {
  'use strict';

  // ---------- حالة اللعبة ----------
  const MAX_LEVELS = GAME_LEVELS.length;            // 50
  const STORAGE_PROGRESS = 'aalaz_progress';        // عدد المراحل المكتملة
  const STORAGE_LANG = 'aalaz_lang';

  const state = {
    lang: 'ar',
    completed: 0,          // عدد المراحل المكتملة (تتقدم منه التالية)
    index: 0,              // فهرس المرحلة الحالية
    atLevelsScreen: false
  };

  // حالة جلسة المرحلة (تتولد في startLevel)
  let level = null;        // الكائن من GAME_LEVELS
  let tries = 0;           // المحاولات المتبقية
  let hintUsed = false;
  let bank = [];           // [{id, letter, picked}]
  let slots = [];          // [{letter, from, tileId} | null]

  // ---------- عناصر DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    welcome: $('#screen-welcome'),
    levels: $('#screen-levels'),
    game: $('#screen-game')
  };
  const els = {
    levelsTitle: $('#levels-title'),
    progressBadge: $('#progress-badge'),
    progressBar: $('#progress-bar'),
    levelsGrid: $('#levels-grid'),
    gameLevelTitle: $('#game-level-title'),
    gameAttempts: $('#game-attempts'),
    imageHint: $('#image-hint'),
    questionText: $('#question-text'),
    answerSlots: $('#answer-slots'),
    letterBank: $('#letter-bank'),
    hintText: $('#hint-text'),
    modalStage: $('#modal-stage-clear'),
    modalStageTitle: $('#modal-clear-title'),
    modalStageText: $('#modal-clear-text'),
    modalGame: $('#modal-game-clear'),
    modalGameTitle: $('#modal-game-title'),
    modalGameText: $('#modal-game-text'),
    modalWrong: $('#modal-wrong'),
    modalWrongTitle: $('#modal-wrong-title'),
    modalWrongText: $('#modal-wrong-text'),
    confettiLayer: $('#confetti-layer')
  };
  const welcomeNote = $('.welcome-note');
  const gameSubtitle = $('.game-subtitle');

  // ---------- أدوات مساعدة ----------
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function splitLetters(word) {
    return Array.from(word);   // يحافظ على النقاط البديلة (sockets e.g. emoji)
  }

  // ---------- الترجمة ----------
  const t = (key) => AppLang.t(key);

  function applyStaticTexts() {
    $('.game-title').textContent = t('appName');
    gameSubtitle.textContent = t('subtitle');
    welcomeNote.textContent = t('welcomeNote');
    els.levelsTitle.textContent = t('levelsTitle');
    $('#btn-hint').textContent = t('hintBtn');
    $('#btn-shuffle').textContent = t('shuffleBtn');
    $('#btn-clear').textContent = t('clearBtn');
    $('#btn-check').textContent = t('checkBtn');
    $('#btn-back-home').setAttribute('aria-label', t('backHome'));
    $('#btn-back-levels').setAttribute('aria-label', t('backLevels'));
  }

  // ---------- التنقل بين الشاشات ----------
  function showScreen(name) {
    Object.keys(screens).forEach((k) => screens[k].classList.toggle('screen--active', k === name));
    console.info(`[aalaz] screen -> ${name}`);
  }

  // ---------- حفظ / تحميل التقدم ----------
  function loadProgress() {
    const saved = parseInt(localStorage.getItem(STORAGE_PROGRESS) || '0', 10);
    state.completed = Number.isFinite(saved) && saved > 0 ? Math.min(saved, MAX_LEVELS) : 0;
    console.info(`[aalaz] progress loaded: ${state.completed}/${MAX_LEVELS}`);
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_PROGRESS, String(state.completed));
    console.info(`[aalaz] progress saved: ${state.completed}/${MAX_LEVELS}`);
  }

  // ---------- شاشة الترحيب ----------
  function bindWelcome() {
    document.querySelectorAll('.btn--lang').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        AppLang.set(lang);
        state.lang = lang;
        applyStaticTexts();
        renderLevels();
        showScreen('levels');
      });
    });
    $('#btn-back-home').addEventListener('click', () => {
      showScreen('welcome');
      state.atLevelsScreen = false;
    });
  }

  // ---------- شاشة المستويات ----------
  function renderLevels() {
    state.atLevelsScreen = true;
    const completed = state.completed;
    els.progressBadge.textContent = `${completed}/${MAX_LEVELS}`;
    els.progressBar.style.width = `${(completed / MAX_LEVELS) * 100}%`;

    els.levelsGrid.innerHTML = '';
    for (let i = 0; i < MAX_LEVELS; i++) {
      const tile = document.createElement('button');
      tile.className = 'level-tile';
      const cls = i < completed ? 'tile-done' : (i === completed ? 'tile-open' : 'tile-locked');
      tile.classList.add(cls);
      tile.style.animationDelay = `${(i % 50) * 0.012}s`;
      const num = document.createElement('span');
      num.className = 'tile-num';
      num.textContent = String(i + 1);
      tile.appendChild(num);
      tile.addEventListener('click', () => {
        if (i <= completed) {
          startLevel(i);
          showScreen('game');
        } else {
          console.warn(`[aalaz] level ${i + 1} locked`);
          shakeElement(tile, 'shake');
        }
      });
      els.levelsGrid.appendChild(tile);
    }
    console.info(`[aalaz] levels grid rendered (${completed} completed)`);
  }

  // ---------- أدوات عامة ----------
  function shakeElement(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // إعادة تشغيل الأنيميشن
    el.classList.add(cls);
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ---------- بدء المرحلة ----------
  function startLevel(idx) {
    state.index = idx;
    level = GAME_LEVELS[idx];
    const letters = splitLetters(currentAnswer());
    bank = letters.map((letter, i) => ({ id: i, letter, picked: false }));
    slots = Array(letters.length).fill(null);
    tries = 3;
    hintUsed = false;

    els.gameLevelTitle.textContent = `${t('levelWord')} ${idx + 1}`;
    els.imageHint.src = `assets/images/${level.image}`;
    els.imageHint.alt = level.image;
    els.questionText.textContent = currentQ();
    els.hintText.textContent = '';
    updateAttempts();

    renderLetters();
    renderSlots();
    console.info(`[aalaz] level ${idx + 1} started (answer: ${currentAnswer()})`);
  }

  function currentAnswer() {
    return level[state.lang].a;
  }

  function currentQ() {
    return level[state.lang].q;
  }

  function currentHint() {
    return level[state.lang].h;
  }

  // ---------- الشبكة: الحروف المبعثرة ----------
  function renderLetters() {
    els.letterBank.innerHTML = '';
    const remaining = bank.filter((b) => !b.picked);
    if (remaining.length === 0) {
      els.letterBank.innerHTML = '';
      return;
    }
    remaining.forEach((b) => {
      const tile = document.createElement('button');
      tile.className = 'letter-tile';
      tile.textContent = b.letter;
      tile.dataset.id = b.id;
      tile.style.animationDelay = `${Math.random() * 0.3}s`;
      tile.addEventListener('click', () => pickLetter(b.id));
      els.letterBank.appendChild(tile);
    });
  }

  function pickLetter(id) {
    if (bank[id].picked) return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) {
      console.warn('[aalaz] no empty slot');
      shakeElement(els.letterBank, 'shake');
      return;
    }
    bank[id].picked = true;
    const cur = bank[id];
    slots[slotIdx] = { letter: cur.letter, from: 'bank', tileId: id };
    renderLetters();
    renderSlots();
    vibrate(8);
  }

  // ---------- شبكة خانات الإجابة ----------
  function renderSlots() {
    els.answerSlots.innerHTML = '';
    const ansLetters = splitLetters(currentAnswer());
    slots.forEach((s, i) => {
      const slot = document.createElement('div');
      slot.className = 'answer-slot';
      if (s) {
        slot.classList.add('filled');
        slot.textContent = s.letter;
        if (s.from === 'hint') slot.classList.add('hint-fixed');
      }
      slot.dataset.index = i;
      slot.addEventListener('click', () => {
        if (s && s.from === 'bank') returnLetterToBank(s.tileId, i);
      });
      els.answerSlots.appendChild(slot);
    });
    // تأكيد سليم: تطابق عدد الخانات مع طول الجواب
    if (ansLetters.length !== slots.length) {
      console.error('[aalaz] Mismatch: slots and answer length');
    }
  }

  function returnLetterToBank(tileId, slotIdx) {
    bank[tileId].picked = false;
    slots[slotIdx] = null;
    renderLetters();
    renderSlots();
    vibrate(6);
  }

  // ---------- أدوات التحكم ----------
  function shuffleLetters() {
    const unpicked = bank.map((b, i) => i).filter((i) => !bank[i].picked);
    const ids = shuffleArray(unpicked);
    const letters = ids.map((i) => bank[i].letter);
    ids.forEach((orig, k) => { bank[orig].letter = letters[k]; });
    renderLetters();
    shakeElement(els.letterBank, 'shake');
    vibrate(10);
    console.info('[aalaz] letters shuffled');
  }

  function clearSlots() {
    slots.forEach((s, i) => {
      if (s && s.from === 'bank') bank[s.tileId].picked = false;
    });
    slots = Array(splitLetters(currentAnswer()).length).fill(null);
    renderLetters();
    renderSlots();
    vibrate(6);
    console.info('[aalaz] slots cleared');
  }

  function useHint() {
    if (hintUsed) {
      els.hintText.textContent = t('noHintsLeft');
      return;
    }
    const ansLetters = splitLetters(currentAnswer());
    const emptyIdx = [];
    slots.forEach((s, i) => { if (s === null) emptyIdx.push(i); });
    if (emptyIdx.length === 0) {
      els.hintText.textContent = t('noHintsLeft');
      return;
    }
    const target = emptyIdx[Math.floor(Math.random() * emptyIdx.length)];
    const correctLetter = ansLetters[target];
    // أزل حرفاً غير ملتقط مطابقاً من البنك
    const matchId = bank.findIndex((b) => !b.picked && b.letter === correctLetter);
    if (matchId === -1) {
      els.hintText.textContent = t('noHintsLeft');
      return;
    }
    bank[matchId].picked = true;
    slots[target] = { letter: correctLetter, from: 'hint', tileId: matchId };
    hintUsed = true;
    els.hintText.textContent = t('hintPrefix') + (currentHint() || t('mediaQuestion'));
    renderLetters();
    renderSlots();
    vibrate(15);
    console.info(`[aalaz] hint used on slot ${target}`);
  }

  // ---------- المحاولات ----------
  function updateAttempts() {
    els.gameAttempts.textContent = '❤️ ' + tries;
  }

  // ---------- التحقق من الإجابة ----------
  function checkAnswer() {
    if (slots.some((s) => s === null)) {
      shakeElement(els.answerSlots, 'shake');
      els.hintText.textContent = t('emptyAnswer');
      vibrate(30);
      return;
    }
    const given = slots.map((s) => s.letter).join('');
    const answer = currentAnswer();

    if (given === answer) {
      onCorrect(answer);
    } else {
      onWrong(answer);
    }
  }

  function onCorrect(answer) {
    console.info(`[aalaz] correct on level ${state.index + 1}`);
    vibrate(120);

    // كشف كامل الإجابة
    const ansLetters = splitLetters(answer);
    const slotEls = els.answerSlots.children;
    Array.from(slotEls).forEach((el, i) => {
      el.textContent = ansLetters[i];
      el.classList.add('reveal');
      el.classList.remove('filled');
    });
    els.hintText.textContent = '';

    launchConfetti();
    completeLevel();
  }

  function completeLevel() {
    if (state.index >= state.completed) {
      state.completed = state.index + 1;
      saveProgress();
    }
    renderLevelsSummary();

    if (state.completed >= MAX_LEVELS) {
      setTimeout(() => {
        els.modalGameTitle.textContent = t('gameClearTitle');
        els.modalGameText.textContent = t('gameClearText');
        els.modalGame.hidden = false;
      }, 500);
    } else {
      setTimeout(() => {
        els.modalStageTitle.textContent = t('stageClearTitle');
        els.modalStageText.textContent = t('stageClearText');
        els.modalStage.hidden = false;
      }, 500);
    }
  }

  function renderLevelsSummary() {
    els.progressBadge.textContent = `${state.completed}/${MAX_LEVELS}`;
    els.progressBar.style.width = `${(state.completed / MAX_LEVELS) * 100}%`;
  }

  function onWrong() {
    tries--;
    updateAttempts();
    shakeElement(els.answerSlots, 'shake');
    vibrate(80);
    console.warn(`[aalaz] wrong answer on level ${state.index + 1}, tries left: ${tries}`);

    // أعد الحروف غير الملتقطة
    slots.forEach((s, i) => {
      if (s && s.from === 'bank') bank[s.tileId].picked = false;
    });
    slots = Array(splitLetters(currentAnswer()).length).fill(null);
    hintUsed = false;
    renderLetters();
    renderSlots();

    if (tries <= 0) {
      els.modalWrongTitle.textContent = t('wrongTitle');
      els.modalWrongText.textContent = t('wrongText') + ' — ' + t('levelWord') + ' ' + (state.index + 1);
      els.modalWrong.hidden = false;
      // أعد المحاولات للسماح بإعادة اللعب في نفس المرحلة
      setTimeout(() => { tries = 3; updateAttempts(); }, 1200);
    } else {
      els.modalWrongTitle.textContent = t('wrongTitle');
      els.modalWrongText.textContent = t('wrongText');
      els.modalWrong.hidden = false;
    }
  }

  // ---------- حلوى احتفالية ----------
  const CONFETTI_COLORS = ['#fbbf24', '#7c3aed', '#06b6d4', '#10b981', '#f43f5e', '#ffffff', '#60a5fa'];
  function launchConfetti() {
    const layer = els.confettiLayer;
    layer.innerHTML = '';
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.width = `${8 + Math.random() * 10}px`;
      piece.style.height = `${10 + Math.random() * 10}px`;
      layer.appendChild(piece);
    }
    setTimeout(() => { layer.innerHTML = ''; }, 4200);
  }

  // ---------- ربط أزرار اللعب ----------
  function bindGameControls() {
    $('#btn-back-levels').addEventListener('click', () => {
      els.modalStage.hidden = true;
      els.modalGame.hidden = true;
      els.modalWrong.hidden = true;
      renderLevels();
      showScreen('levels');
    });
    $('#btn-shuffle').addEventListener('click', shuffleLetters);
    $('#btn-clear').addEventListener('click', clearSlots);
    $('#btn-hint').addEventListener('click', useHint);
    $('#btn-check').addEventListener('click', checkAnswer);

    $('#btn-next-level').addEventListener('click', () => {
      els.modalStage.hidden = true;
      if (state.index + 1 < MAX_LEVELS) {
        startLevel(state.index + 1);
      } else {
        renderLevels();
        showScreen('levels');
      }
    });

    $('#btn-restart-game').addEventListener('click', () => {
      els.modalGame.hidden = true;
      state.completed = 0;
      saveProgress();
      renderLevels();
      showScreen('levels');
    });

    $('#btn-wrong-ok').addEventListener('click', () => {
      els.modalWrong.hidden = true;
    });
  }

  // ---------- تهيئة ----------
  function init() {
    console.info('[aalaz] initializing...');
    state.lang = AppLang.load();
    applyStaticTexts();
    loadProgress();
    bindWelcome();
    bindGameControls();
    showScreen('welcome');
    console.info('[aalaz] ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();