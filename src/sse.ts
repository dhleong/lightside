import { EventEmitter } from "events";
import * as stream from "stream";

import * as koa from "koa";

export interface IEvent {
    id?: string | number;
    comment?: string;
    data?: string;
    event?: string;
    retry?: number;
}

export function* transformEventChunk(chunk: any) {
    if (chunk instanceof Buffer) {
        chunk = {data: chunk.toString("UTF-8")};
    } else if (typeof chunk === "string") {
        chunk = {data: chunk};
    } else if (typeof chunk !== "object") {
        throw new Error("Unexpected chunk type");
    }

    const event = chunk as IEvent;
    if (event.comment) yield `:${event.comment}\n`;
    if (event.event) yield `event: ${event.event}\n`;
    if (event.retry) yield `retry: ${event.retry}\n`;
    if (event.id) yield `id: ${event.id}\n`;
    if (event.data) {
        const withCleanedNewlines = event.data.replace(/\r\n|\r/g, "\n");
        for (const hunk of withCleanedNewlines.split("\n")) {
            yield `data: ${hunk}\n`;
        }
    }

    yield "\n";
}

/**
 * Primary Server-side Event push interface.
 *
 * Events:
 * - "close": The client has disconnected
 *
 * The official name is Server "Sent" Events, but Server "Side"
 * makes this lib's name make sense.
 */
export class ServerSideEvents extends EventEmitter {
    public readonly stream: stream.Transform;

    constructor() {
        super();

        this.stream = new stream.Transform({
            transform: (chunk, encoding, callback) => {
                for (const hunk of transformEventChunk(chunk)) {
                    this.stream.push(hunk);
                }
                callback();
            },
            writableObjectMode: true,
        });
    }

    public send(event: IEvent | string | Buffer) {
        this.stream.write(event);
    }

    public close() {
        this.stream.end();
    }
}
