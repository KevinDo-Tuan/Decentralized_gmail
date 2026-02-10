const params = new URLSearchParams(window.location.search);
const canisterId = params.get("canisterId");

if (canisterId) {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.startsWith("http://") || href.startsWith("https://")) return;

    const url = new URL(href, window.location.origin);
    url.searchParams.set("canisterId", canisterId);
    link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
  });
}
