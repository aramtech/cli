import enq from 'enquirer'
import path from 'path'
import fs from 'fs'
import Logger from './logger.js'

import { download_repo_to } from './github.js'

const read_project_path = async () => {
    const new_project_path = (
        await enq.prompt({
            name: 'path',
            type: 'input',
            message: 'Enter project path (or leave empty to generate in current directory): ',
        })
    )?.path

    const the_path_is_invalid = !new_project_path.match(/^(?:(?:(\.\/)?[_\-a-zA-Z]+[_\-a-zA-Z0-9]*?)|\.)$/)

    if (the_path_is_invalid) {
        Logger.error('invalid path: please enter a valid path for your new project.')
        return read_project_path()
    }

    const the_path_is_cwd = path.resolve('.') === path.resolve(new_project_path)

    if (the_path_is_cwd) {
        const current_directory_content = fs.readdirSync('.')

        if (current_directory_content.length) {
            Logger.error('\nFAILED: The Directory Must be Empty')
            process.exit(1)
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
    const branches = ['fastify-typescript', 'fastify', 'express', 'v1']

    const { branch } = await enq.prompt({
        type: 'select',
        name: 'branch',
        choices: branches,
    })

    return branch.trim()
}

export const start = async (tar = false) => {
    const new_project_path = await read_project_path()
    const branch = await read_branch()

    await download_repo_to(`aramtech/aramtech_rest_api_framework_empty_template`, branch, new_project_path, tar)
}
