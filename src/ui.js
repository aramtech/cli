import enq from 'enquirer'
import ora from 'ora'
import path from 'path'
import fs from 'fs'
import { exec } from './exec.js'
import { execSync } from 'child_process'

import Logger from './logger.js'
import axios from 'axios'

const template_repo_github_link = 'https://github.com/aramtech/aramtech_rest_api_framework_empty_template'
const template_repo_github_api_link = 'https://api.github.com/repos/aramtech/aramtech_rest_api_framework_empty_template'

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

async function git_cli_client(branch, new_project_path) {
    const full_new_project_path = path.resolve(new_project_path)
    execSync(`git clone -b ${branch} ${template_repo_github_link} ${new_project_path}`, {
        stdio: 'inherit',
    })
    execSync(`rm -rf ${full_new_project_path}/.git `)
    return
}

export async function downloadRepo(branch, github_personal_access_token, new_project_path) {
    const loadingSpinner = ora()
    loadingSpinner.start()

    loadingSpinner.text = `Downloading: 0.00%`

    const request_body = {
        method: 'GET',
        url: `${template_repo_github_api_link}/tarball/${branch}`,
        headers: {
            Authorization: `Bearer ${github_personal_access_token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
        responseType: 'stream',
    }
    try {
        const { data, headers } = await axios(request_body)

        return new Promise((resolve, reject) => {
            const new_project_full_path = path.resolve(new_project_path)
            const tar_full_path = path.resolve(path.join('./', 'empty_template.tar.gz'))
            const writer = fs.createWriteStream(tar_full_path)
            const content_length = headers['Content-Length']
            let downloaded_length = 0

            data.on('data', (chunk) => {
                if (content_length) {
                    downloaded_length += chunk.length || 0
                    loadingSpinner.text = `Downloading: ${((downloaded_length / content_length) * 100).toFixed(2)}\%`
                } else {
                    downloaded_length += chunk.length || 0
                    loadingSpinner.text = `Downloading: ${(downloaded_length / 1000).toFixed(2)}kb`
                }
            })

            data.pipe(writer)

            let error = null

            writer.on('error', (err) => {
                error = err
                writer.close()
                Logger.error(error.message)

                reject(false)
            })

            writer.on('close', () => {
                if (!error) {
                    loadingSpinner.stop()
                    execSync(`tar -xf ${tar_full_path} -C ${new_project_full_path}`, {
                        stdio: 'inherit',
                    })

                    execSync(`rm -rf ${tar_full_path}`, {
                        stdio: 'inherit',
                    })

                    const extraction_path = path.join(
                        new_project_full_path,
                        Buffer.from(
                            execSync(`ls`, {
                                cwd: new_project_full_path,
                            }),
                        )
                            .toString('utf-8')
                            .trim(),
                    )
                    execSync(`mv ${extraction_path}/* ./.`, {
                        cwd: new_project_full_path,
                    })

                    execSync(`mv ${path.join(extraction_path, '/.vscode')} .`, {
                        cwd: new_project_full_path,
                    })

                    execSync(`rm -rf ${extraction_path}`, {
                        cwd: new_project_full_path,
                    })
                    resolve(true)
                }
            })
        })
    } catch (error) {
        console.log('status', error?.response?.status, 'Message', error?.message, 'name', error?.name)
        Logger.error('Error: Something went wrong')
        process.exit(1)
    }
}

async function github_api_client(branch, new_project_path) {
    try {
        execSync('tar --version')
    } catch (error) {
        Logger.error('please install "tar" extraction command line')
    }
    let github_personal_access_token = ''
    const loadingSpinner = ora()
    let try_count = 0
    while (true) {
        try_count += 1
        if (try_count >= 3) {
            Logger.error('Maximum try count exceeded')
            process.exit(1)
        }

        github_personal_access_token = (
            await enq.prompt({
                name: 'token',
                type: 'input',
                message: 'Please provide your classic personal github access token (you can create one at https://github.com/settings/tokens)\n\n Token:',
            })
        )?.token
        loadingSpinner.text = 'Verifying Token...'
        loadingSpinner.start()

        try {
            await axios({
                method: 'GET',
                url: template_repo_github_api_link,
                headers: {
                    Authorization: `Bearer ${github_personal_access_token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            })
            loadingSpinner.stop()

            break
        } catch (error) {
            Logger.error('\nInvalid Github Access Token, Please Make sure that the token is valid.\n')
            loadingSpinner.stop()
            continue
        }
    }
    await downloadRepo(branch, github_personal_access_token, new_project_path)
}

const get_client = async (tar) => {
    try {
        if (tar) {
            throw ''
        }
        exec('git --version')
        exec(`git ls-remote ${template_repo_github_link}`)
        return git_cli_client
    } catch (error) {
        return github_api_client
    }
}

const gen = async (new_project_path, pull_from_github, branch) => {
    await pull_from_github(branch, new_project_path)

    Logger.success(
        '\nFinished!\n' +
        'Go to https://handbook.aramtech.ly/#/rest/introduction to learn how you can properly use the framework.\n' +
        'run `npm init` to modify package.json of the project to your liking.',
    )
}

export const start = async (tar = false) => {
    const new_project_path = await read_project_path()
    const branch = await read_branch()

    const github_api_client = await get_client(tar)

    await gen(new_project_path, github_api_client, branch)
}
