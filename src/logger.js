import process from 'process'

const colors = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    console_color: '\x1b[0m',
}

/**
 * @param {"black"|"red"|"green"|"yellow"|"blue"|"magenta"|"cyan"|"white"|"console_color"} color
 * @param {String} text
 * @returns {String}
 */
const color_text = (color, text) => {
    return `${colors[color]}${text}${colors.console_color}`
}

export const error = (message) => {
    console.log(color_text('red', message))
}

export const success = (message) => {
    console.log(color_text('green', message))
}

export const warning = (message) => {
    console.log(color_text('yellow', message))
}

export const fatal = (message) => {
    error(message)
    process.exit(1)
}

export default { error, success, warning, fatal }
