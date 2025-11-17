module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './public/**/*.html',
        './public/js/**/*.js'
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [
          /^modal/,
          /^dropdown/,
          /^btn/,
          /^alert/,
          /^navbar/,
          /^collapse/,
          /^fade/,
          /^show/,
          /^active/,
          /^disabled/
        ],
        deep: [/^bs-/, /^data-bs-/],
        greedy: [/tooltip/, /popover/, /carousel/]
      }
    }),
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifyFontValues: true,
        minifySelectors: true
      }]
    })
  ]
};