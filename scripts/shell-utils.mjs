/** Shared by the capture script, the vite plugin and the drift test. */
export function normalizeShell(html) {
  return (
    html
      // the footer is far below the fold and re-rendered by React anyway
      .replace(/<footer[\s\S]*?<\/footer>/, '')
      // capture-only query string
      .replace(/\?shell-capture/g, '')
      .replace(/>\s+</g, '><')
      .trim()
  )
}

/**
 * Inline, parser-blocking: on any route other than "/", drop the home-specific
 * main content so only the shared header paints until React takes over.
 */
export const SHELL_ROUTE_GUARD =
  "<script>if(location.pathname!=='/'){var m=document.querySelector('#root main');if(m)m.replaceChildren()}</script>"
