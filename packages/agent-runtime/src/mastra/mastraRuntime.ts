import {
  createMastraClient,
  createUnavailableMastraStatus,
  type MastraClientHandle,
  type MastraClientStatus
} from "./mastraClient";

export class MastraRuntime {
  private handle: MastraClientHandle | undefined;
  private initializePromise: Promise<MastraClientHandle> | undefined;

  async initialize(): Promise<MastraClientHandle> {
    if (this.handle) {
      return this.handle;
    }
    this.initializePromise ??= createMastraClient();
    this.handle = await this.initializePromise;
    return this.handle;
  }

  async getStatus(): Promise<MastraClientStatus> {
    try {
      const handle = await this.initialize();
      return handle.status;
    } catch (error) {
      return createUnavailableMastraStatus(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
