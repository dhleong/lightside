import * as koa from "koa";

import { ServerSideEvents } from "./sse";
export { IEvent, ServerSideEvents } from "./sse";

// add our contribution to the interface
declare module "koa" {
    // tslint:disable-next-line
    interface Context {
        events: ServerSideEvents;
    }
}

/**
 * Middleware factory. Subsequent middleware will have access to
 * the `events` property on the Context for sending events to the
 * client. The response `body` will also be set to a {@link stream.Transform}
 * that can be used to write raw event data *or* {@link IEvent} instances.
 */
export function lightside() {
    return async (ctx: koa.Context, next: () => Promise<any>) => {

        ctx.socket.setNoDelay(true);
        ctx.set({
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        });

        ctx.events = new ServerSideEvents();
        ctx.body = ctx.events.stream;

        // forward "close" event for convenience
        ctx.res.on("close", () => {
            ctx.events.emit("close");
        });

        // send initial ":ok"
        ctx.events.send({comment: "ok"});

        return next();
    };
}
