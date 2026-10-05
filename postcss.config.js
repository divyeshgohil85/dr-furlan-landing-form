export default {
    plugins: {
        'postcss-prefix-selector': {
            prefix: '.booking-form-wrapper',
            exclude: [
                // Don't prefix keyframes, they're referenced by name
                /@keyframes/,
                // Don't prefix @property declarations
                /@property/,
                // Don't prefix @supports
                /@supports/,
                // Don't prefix @layer
                /@layer/,
                // Don't prefix @charset
                /@charset/,
            ],
            transform: function (prefix, selector, prefixedSelector) {
                // Don't prefix if selector already contains the wrapper
                if (selector.includes('.booking-form-wrapper')) {
                    return selector;
                }
                // Don't prefix html, body, or :root selectors - they're global
                if (selector.match(/^(html|body|:root)/)) {
                    return selector;
                }
                // Don't prefix if it's a CSS variable definition
                if (selector.startsWith('*') || selector.startsWith(':before') || selector.startsWith(':after')) {
                    // These are for CSS variables, scope them to the wrapper
                    return `.booking-form-wrapper ${selector}`;
                }
                return prefixedSelector;
            }
        }
    }
}

