import * as stream from "stream";

import * as chai from "chai";

import { ServerSideEvents } from "../src/sse";

chai.should();

function read(s: stream.Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        s.on("data", data => chunks.push(data));
        s.on("error", reject);
        s.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
    });
}

describe("ServerSideEvents", () => {
    it("transforms buffers into data", async () => {
        const sse = new ServerSideEvents();
        sse.send(Buffer.from("mreynolds"));
        sse.close();

        const sent = await read(sse.stream);
        sent.toString().should.equal("data: mreynolds\n\n");
    });

    describe("transforms strings into data:", () => {
        it("simple", async () => {
            const sse = new ServerSideEvents();
            sse.send("mreynolds");
            sse.close();

            const sent = await read(sse.stream);
            sent.toString().should.equal("data: mreynolds\n\n");
        });

        it("multiline, with mix of newline semantics", async () => {
            const sse = new ServerSideEvents();
            sse.send("mreynolds\r\nitskaylee\rzoe\nwashandwax");
            sse.close();

            const sent = await read(sse.stream);
            sent.toString().should.equal(
                "data: mreynolds\n" +
                "data: itskaylee\n" +
                "data: zoe\n" +
                "data: washandwax\n" +
                "\n",
            );
        });
    });

    describe("transforms IEvent", () => {
        it("writes comments", async () => {
            const sse = new ServerSideEvents();
            sse.send({comment: "ok"});
            sse.close();

            const sent = await read(sse.stream);
            sent.toString().should.equal(":ok\n\n");
        });

        it("with all fields", async () => {
            const sse = new ServerSideEvents();
            sse.send({
                comment: "incoming",
                data: "mreynolds",
                event: "crazy-ivan",
                id: 1,
                retry: 42,
            });
            sse.close();

            const sent = await read(sse.stream);
            sent.toString().should.equal(
                ":incoming\n" +
                "event: crazy-ivan\n" +
                "retry: 42\n" +
                "id: 1\n" +
                "data: mreynolds\n\n",
            );
        });
    });
});
