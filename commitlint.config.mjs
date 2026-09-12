export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['ui', 'client', 'server', 'auth', 'sentinel', 'docker', 'docs', 'deps', 'repo'],
    ],
    'header-max-length': [2, 'always', 72],
  },
};
