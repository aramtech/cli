#!/usr/bin/env node

import { program } from 'commander'
import { start } from '../src/ui.js'
import logo_in_text_art from '../src/logo_in_text_art.js'

program.name('Aramtech CLI').description('CLI for bootstrapping aram tech projects.').addHelpText('beforeAll', logo_in_text_art).version('1.1.0')

program
    .command('create_rest')
    .description('use to generate a rest API project.')
    .option('-t, --tar', 'Download Tar From Github Api instead of using git')
    .action((options) => {
        const tar = options?.tar
        start(tar)
    })

program.parse()
