(function () {
  FLC.makeStore('fl-chronicle-viewer').then(function (store) {
    FLC.mountUI({ store: store, mode: 'viewer', css: FLC_CSS, settings: {} });
  });
})();
