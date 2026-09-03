import { describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import { waitForKeyPress } from "../src/pause.ts";

class FakeReadStream extends EventEmitter {
  isRaw = false;
  rawModeCalls: boolean[] = [];
  resumeCalls = 0;
  pauseCalls = 0;

  setRawMode(mode: boolean): this {
    this.isRaw = mode;
    this.rawModeCalls.push(mode);
    return this;
  }

  resume(): this {
    this.resumeCalls++;
    return this;
  }

  pause(): this {
    this.pauseCalls++;
    return this;
  }
}

describe("waitForKeyPress", () => {
  it("resolves once the input stream emits data", async () => {
    const fakeInput = new FakeReadStream();

    const promise = waitForKeyPress(fakeInput as unknown as NodeJS.ReadStream);
    fakeInput.emit("data", Buffer.from("x"));
    await promise;

    expect(fakeInput.resumeCalls).toBe(1);
    expect(fakeInput.pauseCalls).toBe(1);
    expect(fakeInput.rawModeCalls).toEqual([true, false]);
  });

  it("restores the previous raw mode after resolving", async () => {
    const fakeInput = new FakeReadStream();
    fakeInput.isRaw = true;

    const promise = waitForKeyPress(fakeInput as unknown as NodeJS.ReadStream);
    fakeInput.emit("data", Buffer.from("x"));
    await promise;

    expect(fakeInput.rawModeCalls).toEqual([true, true]);
  });
});
