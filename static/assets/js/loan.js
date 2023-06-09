
function toggleButtonGroup() {
    const buttonGroup = document.getElementById('buttonGroup');
    const buttonDropdown = document.getElementById('buttonDropdown');

    if (window.innerWidth < 576) {
      buttonGroup.style.display = 'none';
      buttonDropdown.style.display = 'block';
    } else {
      buttonGroup.style.display = 'flex';
      buttonDropdown.style.display = 'none';
    }
  }

  window.addEventListener('resize', toggleButtonGroup);
  toggleButtonGroup();