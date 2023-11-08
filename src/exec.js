import { execSync } from 'child_process'

/**
 *
 * @param {String} command
 * @returns {String}
 */
const exec = (command) => {
    return Buffer.from(execSync(command)).toString('utf-8')
}

const command_on_system = command => {
    try {
        exec(`${command} --version`)
        return true
    } catch (_) {
        return false
    }
}

export { exec, command_on_system }
