const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
  });
  document.getElementById('subscribe-form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const form = event.target;
    const button = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-msg');
    button.innerText = "SENDING...";
    button.disabled = true;
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzjmtH-AHUtMLclKJ5B4m0fz85TfT2Wxw-WZ2QIHNRurqEEqKvR-lqF9mrp9LP_tm4l/exec';
    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
      .then(response => { form.style.display = 'none'; successMsg.style.display = 'block'; })
      .catch(error => { alert("Something went wrong. Please try again."); button.innerText = "SUBSCRIBE"; button.disabled = false; });
  });
  window.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('cefrTestModal');
    const closeBtn = document.getElementById('closeCefrModalBtn');
    const hasSeenPopup = sessionStorage.getItem('cefrPopupShown');
    if (!hasSeenPopup && modal) {
      setTimeout(function() { modal.classList.add('active'); sessionStorage.setItem('cefrPopupShown', 'true'); }, 2000);
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', function(e) { e.preventDefault(); modal.classList.remove('active'); });
    }
    if (modal) {
      modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); } });
    }
  });