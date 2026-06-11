(function () {
  "use strict";
  if (window.self !== window.top) {
    document.documentElement.classList.add("app-in-iframe");
  }
})();
