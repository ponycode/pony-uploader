module.exports = {
	'extends': 'plugin:vue/essential',
	rules: {
		'indent': ['error', 'tab'],
		'no-tabs': 'off',
		'space-in-parens': ['error', 'always'],
		'space-before-blocks': 'off',
		'space-before-function-paren': 'off',
		'keyword-spacing': 'off'
	},
	globals: {
		'XDomainRequest': false,
		'xhr': false
	}
}
