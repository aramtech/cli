import path from 'path'
import fs from 'fs'
import Logger from './logger.js'

import { is_git_installed_on_system, is_repo_reachable_by_cli, get_files_with_git_cli } from './git.js'
import { get_files_with_github_api } from './github.js'
import { read_answer_to, read_choice } from './prompt.js'

const read_project_path = async () => {
    const new_project_path = await read_answer_to('Enter project path (or enter `.` to generate in current directory): ')

    const the_path_is_invalid = !new_project_path.match(/^(?:(?:(\.\/)?[_\-a-zA-Z]+[_\-a-zA-Z0-9]*?)|\.)$/)

    if (the_path_is_invalid) {
        Logger.error('invalid path: please enter a valid path for your new project.')
        return read_project_path()
    }

    const the_path_is_cwd = path.resolve('.') === path.resolve(new_project_path)

    if (the_path_is_cwd) {
        const current_directory_content = fs.readdirSync('.')

        if (current_directory_content.length) {
            Logger.fatal('\nFAILED: The Directory Must be Empty')
        }

        return new_project_path.trim()
    }

    const new_directory_path_exists = fs.existsSync(new_project_path)

    if (new_directory_path_exists) {
        Logger.error('\nFAILED: The Directory Name Already Exists (used)')
        Logger.warning('enter a name for the project that is not used in this directory ')
        return read_project_path()
    }

    fs.mkdirSync(new_project_path, {
        recursive: true,
    })

    return new_project_path.trim()
}

const read_branch = async () => {
    const branches = ['base', 'minimal']
    return await read_choice('Pick branch (express-typescript is recommended): ', branches)
}

export const create_rest = async (tar = false) => {
    const new_project_path = await read_project_path()
    const branch = await read_branch()
    const repo_name = 'aramtech/aramtech_rest_api_framework_empty_template'

    if (tar === false && is_git_installed_on_system() && is_repo_reachable_by_cli(repo_name)) {
        await get_files_with_git_cli(repo_name, branch, new_project_path)
    } else {
        await get_files_with_github_api(repo_name, branch, new_project_path)
    }

    Logger.success(
        '\nFinished!\n' +
            'Go to https://handbook.aramtech.ly/#/rest/introduction to learn how you can properly use the framework.\n' +
            'run `npm init` to modify package.json of the project to your liking.',
    )
}
