/**
 * Social / wallet sign-in from the Figma modal is out of scope. The buttons are
 * shown for visual fidelity but are disabled and say so — they never fake success.
 */
export function UnavailableSocialLogin() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-body text-text-secondary">
        <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
        Ou continue com
        <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {['Google', 'Carteira (WalletConnect)'].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            aria-describedby="social-unavailable"
            className="h-10 cursor-not-allowed rounded-full border border-border-soft text-body text-text-secondary opacity-70"
          >
            {provider}
          </button>
        ))}
        <p id="social-unavailable" className="text-center text-caption text-text-secondary">
          Login social indisponível nesta demonstração.
        </p>
      </div>
    </div>
  )
}
