document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    this.textContent = type === 'password' ? '👁' : '🙈';
});

//index.html script 
function toggleMenu() {
    const nav = document.getElementById('navMenu');
    nav.classList.toggle('active');
}
