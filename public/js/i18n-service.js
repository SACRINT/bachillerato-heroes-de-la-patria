/**
 * 🌍 INTERNATIONALIZATION SERVICE - v1.0.0
 * Servicio de internacionalización para BGE
 *
 * v5.0.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Soporte para 10+ idiomas:
 * - Español (es)
 * - English (en)
 * - Français (fr)
 * - Deutsch (de)
 * - Português (pt)
 * - Italiano (it)
 * - 中文 (zh)
 * - 日本語 (ja)
 * - العربية (ar)
 * - हिन्दी (hi)
 * - Русский (ru)
 */

(function() {
  'use strict';

  // Configuración
  const DEFAULT_LOCALE = 'es';
  const STORAGE_KEY = 'bge_locale';
  const FALLBACK_LOCALE = 'es';

  // Traducciones base
  const translations = {
    es: {
      // Navegación
      nav: {
        home: 'Inicio',
        about: 'Conócenos',
        services: 'Servicios',
        contact: 'Contacto',
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        profile: 'Mi Perfil',
        dashboard: 'Panel de Control'
      },
      // Autenticación
      auth: {
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        register: 'Registrarse',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        rememberMe: 'Recordarme',
        loginWithGoogle: 'Continuar con Google',
        loginSuccess: 'Sesión iniciada correctamente',
        loginError: 'Error al iniciar sesión',
        logoutSuccess: 'Sesión cerrada correctamente'
      },
      // Dashboard
      dashboard: {
        welcome: 'Bienvenido',
        students: 'Estudiantes',
        teachers: 'Docentes',
        grades: 'Calificaciones',
        attendance: 'Asistencia',
        notifications: 'Notificaciones',
        reports: 'Reportes',
        settings: 'Configuración'
      },
      // Estudiantes
      students: {
        title: 'Gestión de Estudiantes',
        add: 'Agregar Estudiante',
        edit: 'Editar Estudiante',
        delete: 'Eliminar Estudiante',
        search: 'Buscar estudiantes...',
        name: 'Nombre',
        lastName: 'Apellidos',
        email: 'Correo',
        grade: 'Grado',
        group: 'Grupo',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        graduated: 'Egresado'
      },
      // Calificaciones
      grades: {
        title: 'Calificaciones',
        subject: 'Materia',
        score: 'Calificación',
        period: 'Periodo',
        average: 'Promedio',
        passing: 'Aprobado',
        failing: 'Reprobado',
        pending: 'Pendiente'
      },
      // Notificaciones
      notifications: {
        title: 'Notificaciones',
        markAsRead: 'Marcar como leída',
        markAllAsRead: 'Marcar todas como leídas',
        noNotifications: 'No hay notificaciones',
        new: 'Nueva notificación'
      },
      // Formularios
      forms: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        update: 'Actualizar',
        search: 'Buscar',
        filter: 'Filtrar',
        clear: 'Limpiar',
        submit: 'Enviar',
        loading: 'Cargando...',
        required: 'Campo requerido',
        invalid: 'Valor inválido'
      },
      // Mensajes
      messages: {
        success: 'Operación exitosa',
        error: 'Ha ocurrido un error',
        confirm: '¿Estás seguro?',
        confirmDelete: '¿Deseas eliminar este elemento?',
        saved: 'Guardado correctamente',
        deleted: 'Eliminado correctamente',
        updated: 'Actualizado correctamente',
        notFound: 'No encontrado',
        noResults: 'No se encontraron resultados'
      },
      // Fechas y tiempo
      datetime: {
        today: 'Hoy',
        yesterday: 'Ayer',
        tomorrow: 'Mañana',
        week: 'Semana',
        month: 'Mes',
        year: 'Año',
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      },
      // Accesibilidad
      accessibility: {
        skipToContent: 'Saltar al contenido principal',
        openMenu: 'Abrir menú',
        closeMenu: 'Cerrar menú',
        loading: 'Cargando contenido',
        error: 'Error al cargar',
        required: 'Campo obligatorio'
      }
    },

    en: {
      nav: {
        home: 'Home',
        about: 'About Us',
        services: 'Services',
        contact: 'Contact',
        login: 'Login',
        logout: 'Logout',
        profile: 'My Profile',
        dashboard: 'Dashboard'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot your password?',
        rememberMe: 'Remember me',
        loginWithGoogle: 'Continue with Google',
        loginSuccess: 'Login successful',
        loginError: 'Login error',
        logoutSuccess: 'Logout successful'
      },
      dashboard: {
        welcome: 'Welcome',
        students: 'Students',
        teachers: 'Teachers',
        grades: 'Grades',
        attendance: 'Attendance',
        notifications: 'Notifications',
        reports: 'Reports',
        settings: 'Settings'
      },
      students: {
        title: 'Student Management',
        add: 'Add Student',
        edit: 'Edit Student',
        delete: 'Delete Student',
        search: 'Search students...',
        name: 'Name',
        lastName: 'Last Name',
        email: 'Email',
        grade: 'Grade',
        group: 'Group',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        graduated: 'Graduated'
      },
      grades: {
        title: 'Grades',
        subject: 'Subject',
        score: 'Score',
        period: 'Period',
        average: 'Average',
        passing: 'Passing',
        failing: 'Failing',
        pending: 'Pending'
      },
      notifications: {
        title: 'Notifications',
        markAsRead: 'Mark as read',
        markAllAsRead: 'Mark all as read',
        noNotifications: 'No notifications',
        new: 'New notification'
      },
      forms: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        search: 'Search',
        filter: 'Filter',
        clear: 'Clear',
        submit: 'Submit',
        loading: 'Loading...',
        required: 'Required field',
        invalid: 'Invalid value'
      },
      messages: {
        success: 'Operation successful',
        error: 'An error occurred',
        confirm: 'Are you sure?',
        confirmDelete: 'Do you want to delete this item?',
        saved: 'Saved successfully',
        deleted: 'Deleted successfully',
        updated: 'Updated successfully',
        notFound: 'Not found',
        noResults: 'No results found'
      },
      datetime: {
        today: 'Today',
        yesterday: 'Yesterday',
        tomorrow: 'Tomorrow',
        week: 'Week',
        month: 'Month',
        year: 'Year',
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      },
      accessibility: {
        skipToContent: 'Skip to main content',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        loading: 'Loading content',
        error: 'Error loading',
        required: 'Required field'
      }
    },

    fr: {
      nav: {
        home: 'Accueil',
        about: 'À propos',
        services: 'Services',
        contact: 'Contact',
        login: 'Connexion',
        logout: 'Déconnexion',
        profile: 'Mon profil',
        dashboard: 'Tableau de bord'
      },
      auth: {
        login: 'Connexion',
        logout: 'Déconnexion',
        register: "S'inscrire",
        email: 'E-mail',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        forgotPassword: 'Mot de passe oublié?',
        rememberMe: 'Se souvenir de moi',
        loginWithGoogle: 'Continuer avec Google',
        loginSuccess: 'Connexion réussie',
        loginError: 'Erreur de connexion',
        logoutSuccess: 'Déconnexion réussie'
      },
      forms: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        update: 'Mettre à jour',
        search: 'Rechercher',
        filter: 'Filtrer',
        clear: 'Effacer',
        submit: 'Soumettre',
        loading: 'Chargement...',
        required: 'Champ requis',
        invalid: 'Valeur invalide'
      },
      messages: {
        success: 'Opération réussie',
        error: 'Une erreur est survenue',
        confirm: 'Êtes-vous sûr?',
        confirmDelete: 'Voulez-vous supprimer cet élément?',
        saved: 'Enregistré avec succès',
        deleted: 'Supprimé avec succès',
        updated: 'Mis à jour avec succès',
        notFound: 'Non trouvé',
        noResults: 'Aucun résultat trouvé'
      }
    },

    de: {
      nav: {
        home: 'Startseite',
        about: 'Über uns',
        services: 'Dienste',
        contact: 'Kontakt',
        login: 'Anmelden',
        logout: 'Abmelden',
        profile: 'Mein Profil',
        dashboard: 'Dashboard'
      },
      auth: {
        login: 'Anmelden',
        logout: 'Abmelden',
        register: 'Registrieren',
        email: 'E-Mail',
        password: 'Passwort',
        confirmPassword: 'Passwort bestätigen',
        forgotPassword: 'Passwort vergessen?',
        rememberMe: 'Angemeldet bleiben',
        loginWithGoogle: 'Mit Google fortfahren',
        loginSuccess: 'Anmeldung erfolgreich',
        loginError: 'Anmeldefehler',
        logoutSuccess: 'Abmeldung erfolgreich'
      },
      forms: {
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        create: 'Erstellen',
        update: 'Aktualisieren',
        search: 'Suchen',
        filter: 'Filtern',
        clear: 'Löschen',
        submit: 'Absenden',
        loading: 'Laden...',
        required: 'Pflichtfeld',
        invalid: 'Ungültiger Wert'
      }
    },

    pt: {
      nav: {
        home: 'Início',
        about: 'Sobre nós',
        services: 'Serviços',
        contact: 'Contato',
        login: 'Entrar',
        logout: 'Sair',
        profile: 'Meu perfil',
        dashboard: 'Painel'
      },
      auth: {
        login: 'Entrar',
        logout: 'Sair',
        register: 'Registrar',
        email: 'E-mail',
        password: 'Senha',
        confirmPassword: 'Confirmar senha',
        forgotPassword: 'Esqueceu sua senha?',
        rememberMe: 'Lembrar-me',
        loginWithGoogle: 'Continuar com Google',
        loginSuccess: 'Login realizado com sucesso',
        loginError: 'Erro ao entrar',
        logoutSuccess: 'Logout realizado com sucesso'
      },
      forms: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        create: 'Criar',
        update: 'Atualizar',
        search: 'Buscar',
        filter: 'Filtrar',
        clear: 'Limpar',
        submit: 'Enviar',
        loading: 'Carregando...',
        required: 'Campo obrigatório',
        invalid: 'Valor inválido'
      }
    },

    zh: {
      nav: {
        home: '首页',
        about: '关于我们',
        services: '服务',
        contact: '联系',
        login: '登录',
        logout: '退出',
        profile: '我的资料',
        dashboard: '控制面板'
      },
      auth: {
        login: '登录',
        logout: '退出',
        register: '注册',
        email: '电子邮件',
        password: '密码',
        confirmPassword: '确认密码',
        forgotPassword: '忘记密码？',
        rememberMe: '记住我',
        loginWithGoogle: '使用Google继续',
        loginSuccess: '登录成功',
        loginError: '登录错误',
        logoutSuccess: '退出成功'
      },
      forms: {
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        create: '创建',
        update: '更新',
        search: '搜索',
        filter: '筛选',
        clear: '清除',
        submit: '提交',
        loading: '加载中...',
        required: '必填字段',
        invalid: '无效值'
      }
    },

    ja: {
      nav: {
        home: 'ホーム',
        about: '会社概要',
        services: 'サービス',
        contact: 'お問い合わせ',
        login: 'ログイン',
        logout: 'ログアウト',
        profile: 'マイプロフィール',
        dashboard: 'ダッシュボード'
      },
      auth: {
        login: 'ログイン',
        logout: 'ログアウト',
        register: '登録',
        email: 'メール',
        password: 'パスワード',
        confirmPassword: 'パスワード確認',
        forgotPassword: 'パスワードをお忘れですか？',
        rememberMe: 'ログイン状態を保持',
        loginWithGoogle: 'Googleで続ける',
        loginSuccess: 'ログイン成功',
        loginError: 'ログインエラー',
        logoutSuccess: 'ログアウト成功'
      },
      forms: {
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        edit: '編集',
        create: '作成',
        update: '更新',
        search: '検索',
        filter: 'フィルター',
        clear: 'クリア',
        submit: '送信',
        loading: '読み込み中...',
        required: '必須項目',
        invalid: '無効な値'
      }
    },

    ar: {
      nav: {
        home: 'الرئيسية',
        about: 'من نحن',
        services: 'الخدمات',
        contact: 'اتصل بنا',
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج',
        profile: 'ملفي الشخصي',
        dashboard: 'لوحة التحكم'
      },
      auth: {
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج',
        register: 'التسجيل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        rememberMe: 'تذكرني',
        loginWithGoogle: 'المتابعة باستخدام Google',
        loginSuccess: 'تم تسجيل الدخول بنجاح',
        loginError: 'خطأ في تسجيل الدخول',
        logoutSuccess: 'تم تسجيل الخروج بنجاح'
      },
      forms: {
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        create: 'إنشاء',
        update: 'تحديث',
        search: 'بحث',
        filter: 'تصفية',
        clear: 'مسح',
        submit: 'إرسال',
        loading: 'جاري التحميل...',
        required: 'حقل مطلوب',
        invalid: 'قيمة غير صالحة'
      }
    },

    hi: {
      nav: {
        home: 'होम',
        about: 'हमारे बारे में',
        services: 'सेवाएं',
        contact: 'संपर्क',
        login: 'लॉग इन',
        logout: 'लॉग आउट',
        profile: 'मेरी प्रोफ़ाइल',
        dashboard: 'डैशबोर्ड'
      },
      auth: {
        login: 'लॉग इन',
        logout: 'लॉग आउट',
        register: 'पंजीकरण',
        email: 'ईमेल',
        password: 'पासवर्ड',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        forgotPassword: 'पासवर्ड भूल गए?',
        rememberMe: 'मुझे याद रखें',
        loginWithGoogle: 'Google के साथ जारी रखें',
        loginSuccess: 'लॉगिन सफल',
        loginError: 'लॉगिन त्रुटि',
        logoutSuccess: 'लॉगआउट सफल'
      },
      forms: {
        save: 'सहेजें',
        cancel: 'रद्द करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        create: 'बनाएं',
        update: 'अपडेट करें',
        search: 'खोजें',
        filter: 'फ़िल्टर',
        clear: 'साफ़ करें',
        submit: 'जमा करें',
        loading: 'लोड हो रहा है...',
        required: 'आवश्यक फ़ील्ड',
        invalid: 'अमान्य मान'
      }
    },

    ru: {
      nav: {
        home: 'Главная',
        about: 'О нас',
        services: 'Услуги',
        contact: 'Контакты',
        login: 'Войти',
        logout: 'Выйти',
        profile: 'Мой профиль',
        dashboard: 'Панель управления'
      },
      auth: {
        login: 'Войти',
        logout: 'Выйти',
        register: 'Регистрация',
        email: 'Эл. почта',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        forgotPassword: 'Забыли пароль?',
        rememberMe: 'Запомнить меня',
        loginWithGoogle: 'Продолжить с Google',
        loginSuccess: 'Вход выполнен успешно',
        loginError: 'Ошибка входа',
        logoutSuccess: 'Выход выполнен успешно'
      },
      forms: {
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        create: 'Создать',
        update: 'Обновить',
        search: 'Поиск',
        filter: 'Фильтр',
        clear: 'Очистить',
        submit: 'Отправить',
        loading: 'Загрузка...',
        required: 'Обязательное поле',
        invalid: 'Недопустимое значение'
      }
    },

    it: {
      nav: {
        home: 'Home',
        about: 'Chi siamo',
        services: 'Servizi',
        contact: 'Contatti',
        login: 'Accedi',
        logout: 'Esci',
        profile: 'Il mio profilo',
        dashboard: 'Pannello di controllo'
      },
      auth: {
        login: 'Accedi',
        logout: 'Esci',
        register: 'Registrati',
        email: 'E-mail',
        password: 'Password',
        confirmPassword: 'Conferma password',
        forgotPassword: 'Password dimenticata?',
        rememberMe: 'Ricordami',
        loginWithGoogle: 'Continua con Google',
        loginSuccess: 'Accesso riuscito',
        loginError: 'Errore di accesso',
        logoutSuccess: 'Disconnessione riuscita'
      },
      forms: {
        save: 'Salva',
        cancel: 'Annulla',
        delete: 'Elimina',
        edit: 'Modifica',
        create: 'Crea',
        update: 'Aggiorna',
        search: 'Cerca',
        filter: 'Filtra',
        clear: 'Cancella',
        submit: 'Invia',
        loading: 'Caricamento...',
        required: 'Campo obbligatorio',
        invalid: 'Valore non valido'
      }
    }
  };

  /**
   * Servicio de Internacionalización
   */
  class I18nService {
    constructor() {
      this.currentLocale = this._getStoredLocale() || this._detectBrowserLocale() || DEFAULT_LOCALE;
      this.observers = [];
    }

    /**
     * Obtener traducción
     * @param {string} key - Clave de traducción (ej: 'auth.login')
     * @param {Object} params - Parámetros para interpolación
     * @returns {string} Texto traducido
     */
    t(key, params = {}) {
      const keys = key.split('.');
      let value = translations[this.currentLocale];

      // Navegar por la estructura
      for (const k of keys) {
        if (value && value[k] !== undefined) {
          value = value[k];
        } else {
          // Fallback al idioma por defecto
          value = this._getFallback(keys);
          break;
        }
      }

      // Si aún no hay valor, retornar la clave
      if (typeof value !== 'string') {
        void 0;
        return key;
      }

      // Interpolación de parámetros
      return this._interpolate(value, params);
    }

    /**
     * Cambiar idioma
     * @param {string} locale - Código de idioma
     */
    setLocale(locale) {
      if (!translations[locale]) {
        void 0;
        return;
      }

      this.currentLocale = locale;
      this._storeLocale(locale);
      this._updateDocumentLang(locale);
      this._notifyObservers();

      void 0;
    }

    /**
     * Obtener idioma actual
     * @returns {string}
     */
    getLocale() {
      return this.currentLocale;
    }

    /**
     * Obtener lista de idiomas disponibles
     * @returns {Array}
     */
    getAvailableLocales() {
      return Object.keys(translations).map(code => ({
        code,
        name: this._getLocaleName(code),
        native: this._getNativeName(code)
      }));
    }

    /**
     * Suscribirse a cambios de idioma
     * @param {Function} callback
     * @returns {Function} Función para desuscribirse
     */
    subscribe(callback) {
      this.observers.push(callback);
      return () => {
        this.observers = this.observers.filter(cb => cb !== callback);
      };
    }

    /**
     * Formatear fecha según locale
     * @param {Date} date
     * @param {Object} options
     * @returns {string}
     */
    formatDate(date, options = {}) {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return new Intl.DateTimeFormat(this.currentLocale, { ...defaultOptions, ...options }).format(date);
    }

    /**
     * Formatear número según locale
     * @param {number} number
     * @param {Object} options
     * @returns {string}
     */
    formatNumber(number, options = {}) {
      return new Intl.NumberFormat(this.currentLocale, options).format(number);
    }

    /**
     * Formatear moneda según locale
     * @param {number} amount
     * @param {string} currency
     * @returns {string}
     */
    formatCurrency(amount, currency = 'MXN') {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency
      }).format(amount);
    }

    /**
     * Traducir elementos del DOM
     */
    translateDOM() {
      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = this.t(key);

        if (el.hasAttribute('data-i18n-attr')) {
          const attr = el.getAttribute('data-i18n-attr');
          el.setAttribute(attr, text);
        } else {
          el.textContent = text;
        }
      });

      // Placeholders
      const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
      placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = this.t(key);
      });

      // ARIA labels
      const ariaLabels = document.querySelectorAll('[data-i18n-aria]');
      ariaLabels.forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        el.setAttribute('aria-label', this.t(key));
      });
    }

    // Métodos privados

    _getStoredLocale() {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    }

    _storeLocale(locale) {
      try {
        localStorage.setItem(STORAGE_KEY, locale);
      } catch (e) {
        void 0;
      }
    }

    _detectBrowserLocale() {
      const browserLang = navigator.language || navigator.userLanguage;
      const shortLang = browserLang.split('-')[0];
      return translations[shortLang] ? shortLang : null;
    }

    _getFallback(keys) {
      let value = translations[FALLBACK_LOCALE];
      for (const k of keys) {
        if (value && value[k] !== undefined) {
          value = value[k];
        } else {
          return null;
        }
      }
      return value;
    }

    _interpolate(text, params) {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    _updateDocumentLang(locale) {
      document.documentElement.lang = locale;

      // Dirección RTL para árabe
      if (locale === 'ar') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }

    _notifyObservers() {
      this.observers.forEach(cb => cb(this.currentLocale));
    }

    _getLocaleName(code) {
      const names = {
        es: 'Spanish', en: 'English', fr: 'French', de: 'German',
        pt: 'Portuguese', it: 'Italian', zh: 'Chinese', ja: 'Japanese',
        ar: 'Arabic', hi: 'Hindi', ru: 'Russian'
      };
      return names[code] || code;
    }

    _getNativeName(code) {
      const names = {
        es: 'Español', en: 'English', fr: 'Français', de: 'Deutsch',
        pt: 'Português', it: 'Italiano', zh: '中文', ja: '日本語',
        ar: 'العربية', hi: 'हिन्दी', ru: 'Русский'
      };
      return names[code] || code;
    }
  }

  // Crear instancia global
  const i18n = new I18nService();

  // Helper global
  window.i18n = i18n;
  window.t = (key, params) => i18n.t(key, params);

  // Traducir DOM cuando esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.translateDOM());
  } else {
    i18n.translateDOM();
  }

  void 0;
})();
