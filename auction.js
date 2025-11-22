// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuIcon = document.getElementById("menu-icon");
  const closeMenu = document.getElementById("closeMenu");

// Toggle menu function
  function toggleMobileMenu() {
    mobileMenu.classList.toggle("active");
  }


  // Open menu when clicking hamburger icon
  if (menuIcon) {
    menuIcon.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMobileMenu();
    });
  }

  // Close menu when clicking X button
  if (closeMenu) {
    closeMenu.addEventListener("click", function () {
      mobileMenu.classList.remove("active");
    });
  }
