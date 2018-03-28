declare module 'fs-router' {
    import { IncomingMessage } from 'http'
    import { RequestHandler } from 'micro'

    interface fConfig {
        filter: (f: string) => boolean
    }

    function match(req: IncomingMessage): RequestHandler | void
    function router(routesDir: string, config?: fConfig): (req: IncomingMessage) => RequestHandler | void

    export = router
}
