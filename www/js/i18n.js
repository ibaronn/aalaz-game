/* ============================================================
   العاز — ترجمة الواجهة (i18n) عربي/إنجليزي
   ============================================================ */

const I18N = {
  ar: {
    appName: 'العاز',
    subtitle: 'ألغاز كلمات متنوعة حول العالم!',
    welcomeNote: '50 مرحلة · تلميحات بالصور · تقدم محفوظ',
    levelsTitle: 'اختر المرحلة',
    progressLabel: 'التقدم',
    backHome: 'رجوع',
    backLevels: 'رجوع',
    levelWord: 'المرحلة',
    attempts: 'محاولات',
    hintBtn: '💡 تلميح',
    shuffleBtn: '🔀 خلط',
    clearBtn: '🗑 مسح',
    checkBtn: 'تحقق ✓',
    hintPrefix: '💡 تلميح: ',
    noHintsLeft: 'لا توجد تلميحات متبقية',
    stageClearTitle: 'أحسنت!',
    stageClearText: 'أنت أتممت المرحلة بنجاح',
    nextLevel: 'المرحلة التالية ←',
    gameClearTitle: 'مذهل!',
    gameClearText: 'أتممت كل المراحل الخمسين! أنت بطل الألغاز!',
    restartGame: 'العب من جديد ↻',
    wrongTitle: 'غير صحيحة!',
    wrongText: 'حاول مجدداً — رتّب الحروف بعناية',
    wrongOk: 'حسناً',
    chooseCorrect: 'أجب أولاً',
    emptyAnswer: 'رتّب الحروف أولاً',
    levelLockedNote: 'أكمل المرحلة السابقة أولاً',
    mediaQuestion: 'التلميح: انظر بعناية إلى الصورة'
  },
  en: {
    appName: 'Al-Aaz',
    subtitle: 'Fun word puzzles from around the world!',
    welcomeNote: '50 levels · picture hints · saved progress',
    levelsTitle: 'Choose a Level',
    progressLabel: 'Progress',
    backHome: 'Back',
    backLevels: 'Back',
    levelWord: 'Level',
    attempts: 'Attempts',
    hintBtn: '💡 Hint',
    shuffleBtn: '🔀 Shuffle',
    clearBtn: '🗑 Clear',
    checkBtn: 'Check ✓',
    hintPrefix: '💡 Hint: ',
    noHintsLeft: 'No hints left',
    stageClearTitle: 'Well done!',
    stageClearText: 'You cleared this level!',
    nextLevel: 'Next Level →',
    gameClearTitle: 'Amazing!',
    gameClearText: 'You completed all 50 levels! Puzzle champion!',
    restartGame: 'Play again ↻',
    wrongTitle: 'Not correct!',
    wrongText: 'Try again — rearrange the letters carefully',
    wrongOk: 'OK',
    chooseCorrect: 'Answer first',
    emptyAnswer: 'Place the letters first',
    levelLockedNote: 'Complete the previous level first',
    mediaQuestion: 'Hint: Look closely at the picture'
  }
};

const AppLang = {
  current: 'ar',

  set(lang) {
    if (!I18N[lang]) lang = 'ar';
    this.current = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('aalaz_lang', lang);
    console.info(`[i18n] Language set to: ${lang}`);
  },

  load() {
    const saved = localStorage.getItem('aalaz_lang');
    this.set(saved || 'ar');
    return this.current;
  },

  t(key) {
    const table = I18N[this.current] || I18N.ar;
    return table[key] !== undefined ? table[key] : I18N.ar[key];
  }
};