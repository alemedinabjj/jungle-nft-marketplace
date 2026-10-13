/** Conventional Commits, plus a hard ban on AI attribution trailers. */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'scope-empty': [1, 'never'],
    'no-ai-attribution': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'no-ai-attribution': ({ raw }) => {
          const forbidden = /(co-authored-by|claude|anthropic|chatgpt|openai|copilot|generated with)/i
          return [
            !forbidden.test(raw ?? ''),
            'Commit message must not contain AI attribution or co-author trailers.',
          ]
        },
      },
    },
  ],
}
