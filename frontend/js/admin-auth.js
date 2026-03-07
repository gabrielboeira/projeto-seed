import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA7rYcAyjiaC21ZjC5g7m9cegSkZyAQs0",
  authDomain: "seed-b9834.firebaseapp.com",
  projectId: "seed-b9834",
  storageBucket: "seed-b9834.firebasestorage.app",
  messagingSenderId: "623181920881",
  appId: "1:623181920881:web:6cd7d2e38ed18c981ef9d0"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

const isLoginPage = document.getElementById('btn-login') !== null;
const isAdminPage = document.getElementById('btn-submit') !== null;

// ── Página de LOGIN ───────────────────────────────────
if (isLoginPage) {

  // Se já estiver logado, vai direto pro admin
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'painel-seed.html';
  });

  window.fazerLogin = async function () {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const btn   = document.getElementById('btn-login');
    const erro  = document.getElementById('login-error');

    if (!email || !senha) {
      erro.textContent = 'Preencha e-mail e senha.';
      erro.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';
    erro.style.display = 'none';

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      window.location.href = 'manager-seed.html';
    } catch (err) {
      erro.textContent = traduzirErroFirebase(err.code);
      erro.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  };

  // Enter no campo de senha
  document.getElementById('login-senha')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') window.fazerLogin();
  });

  window.toggleSenha = function () {
    const input = document.getElementById('login-senha');
    input.type = input.type === 'password' ? 'text' : 'password';
  };
}

// ── Página do ADMIN ───────────────────────────────────
if (isAdminPage) {

  // Protege a página — redireciona se não estiver logado
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'manager-seed.html';
    } else {
      // Mostra e-mail do admin logado no header
      const badge = document.getElementById('admin-user-badge');
      if (badge) badge.textContent = user.email;
    }
  });

  // Logout
  window.fazerLogout = async function () {
    await signOut(auth);
    window.location.href = 'manager-seed.html';
  };
}

// ── Tradução dos erros do Firebase ───────────────────
function traduzirErroFirebase(code) {
  const erros = {
    'auth/invalid-email':       'E-mail inválido.',
    'auth/user-not-found':      'Usuário não encontrado.',
    'auth/wrong-password':      'Senha incorreta.',
    'auth/invalid-credential':  'E-mail ou senha incorretos.',
    'auth/too-many-requests':   'Muitas tentativas. Tente novamente mais tarde.',
    'auth/user-disabled':       'Esta conta foi desativada.',
  };
  return erros[code] || 'Erro ao fazer login. Tente novamente.';
}
