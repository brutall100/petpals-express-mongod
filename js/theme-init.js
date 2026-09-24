// Runs before the page is drawn: applies the saved theme so there is no flash.
(function () {
    var root = document.documentElement;
    var saved = null;
    try {
        saved = localStorage.getItem('petpals-theme');
    } catch (e) {
        // Storage is blocked (private mode): the system theme is used.
    }
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;

    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.activeTheme = root.dataset.theme || (systemDark ? 'dark' : 'light');
    root.classList.add('js');
})();
