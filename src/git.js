import path from 'path'
import { run_command, command_on_system } from './exec.js'

export const is_git_installed_on_system = () => command_on_system('git')

const repo_name_to_cli_link = (repo_name) => `https://github.com/${repo_name}`

export const is_repo_reachable_by_cli = (repository_name) => {
    try {
        run_command(`git ls-remote ${repo_name_to_cli_link(repository_name)}`)
        return true
    } catch (_) {
        return false
    }
}

export const get_files_with_git_cli = async (repo_name, branch, new_project_path) => {
    const full_new_project_path = path.resolve(new_project_path)

    run_command(`git clone --depth=1 -b ${branch} ${repo_name_to_cli_link(repo_name)} ${new_project_path}`, {
        stdio: 'inherit',
    })
    run_command(`rm -rf ${full_new_project_path}/.git `)
    return
}
