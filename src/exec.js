import { execSync } from 'child_process'

const run_command = (command, opts) => execSync(command, opts)

const command_on_system = (command) => {
    try {
        run_command(`${command} --version`)
        return true
    } catch (_) {
        return false
    }
}

export { run_command, command_on_system }
