module.exports = {
  root: true,
  env: {
	node: true
  },
  'extends': [
	'plugin:vue/essential',
	'@vue/standard'
  ],
  rules: {
	'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	'indent': ['error', 'tab'],
	'no-tabs': 'off',
	'space-in-parens': ['error', 'always'],
	'space-before-blocks': 'off',
	'space-before-function-paren': 'off',
	'keyword-spacing': 'off'
  },
  parserOptions: {
	parser: 'babel-eslint'
  },
  globals: {
    'XDomainRequest': false,
    'xhr': false
  }
}
