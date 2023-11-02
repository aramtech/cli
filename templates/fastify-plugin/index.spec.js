import Fastify from 'fastify'
import plugin from './index.js'

import { describe, it, vi, expect } from 'vitest'

describe('plugin test', () => {
    it('should register successfully, and print a greeting.', async () => {
        const console_log_spy = vi.spyOn(console, 'log').mockImplementationOnce(() => {})
        const app = Fastify({ logger: false })
        await app.register(plugin)

        expect(console_log_spy).toHaveBeenCalledTimes(1)
        expect(console_log_spy).toHaveBeenCalledWith('Hello world!')
    })
})
