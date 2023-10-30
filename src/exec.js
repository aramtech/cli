import { execSync } from 'child_process'

/**
 *
 * @param {String} command
 * @returns {String}
 */
const exec = (command) => {
    return Buffer.from(execSync(command)).toString('utf-8')
}
export { exec }
