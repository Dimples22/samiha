const toggle = document.getElementById("nav-toggle");
const links = document.getElementById("nav-links");

toggle.addEventListener("click", () => {
  links.classList.toggle("active");
});

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  
  navToggle.classList.toggle('open');
});

