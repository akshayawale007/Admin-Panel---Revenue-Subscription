/** Inline before paint to avoid theme flash */
export const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem('yoco-theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`
