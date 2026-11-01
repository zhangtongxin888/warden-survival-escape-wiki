// 2026-11-01: Adsterra Popunder + Social Bar only (Banner/Native removed; units kept in Adsterra).
// Hands a Pop+SB config to the shared classic runtime /adsterra/runtime-popsb.js (sha256 d3aa9c32):
// Pop 3/visitor/day, Social Bar 3/day after 4 s, never on legal pages / 404.
import { adsterraConfig as c } from "./config.js";
(function () {
  var p = location.pathname.replace(/\/+$/, "") || "/";
  var ex = c.adsterraExcludedPaths || [];
  if (ex.indexOf(p) >= 0 || ex.indexOf(p + ".html") >= 0) return;
  if (document.getElementById("adsterra-config")) return;
  var n = document.createElement("script");
  n.type = "application/json"; n.id = "adsterra-config";
  n.textContent = JSON.stringify({ adNetwork: "adsterra", status: "ready", cleanPage: false, slots: [],
    enablePopunder: !!(c.adsterraEnablePopunder && c.adsterraPopunderScriptUrl),
    enableSocialBar: !!(c.adsterraEnableSocialBar && c.adsterraSocialBarScriptUrl),
    popunderScriptUrl: c.adsterraPopunderScriptUrl || "", socialBarScriptUrl: c.adsterraSocialBarScriptUrl || "" });
  document.body.appendChild(n);
  var s = document.createElement("script");
  s.id = "adsterra-runtime"; s.src = "/adsterra/runtime-popsb.js"; s.async = true;
  document.body.appendChild(s);
})();
