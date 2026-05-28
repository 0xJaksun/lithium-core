import { describe, it, expect } from "vitest";
import {
  NotFoundError,
  createClusterService,
  createEntryService,
} from "@lithium-ai/core";
import { PostgresClusterAdapter } from "../cluster/cluster.port";
import { PostgresEntryAdapter } from "./entry.port";
import { setupTestDb } from "../test/setup";

describe("Entry Integration", async () => {
  const sql = await setupTestDb();
  const clusterService = createClusterService(new PostgresClusterAdapter(sql));
  const entryService = createEntryService(new PostgresEntryAdapter(sql));

  async function createTestCluster() {
    const result = await clusterService.create({ name: crypto.randomUUID() });
    if (!result.success) throw new Error("Cluster creation failed");
    return result.value;
  }

  async function createTestEntry() {
    const cluster = await createTestCluster();
    const result = await entryService.create({ clusterId: cluster.id });
    if (!result.success) throw new Error("Entry creation failed");
    return { cluster, ...result.value };
  }

  it("should create an entry with version 1 for the given cluster", async () => {
    // Arrange
    const cluster = await createTestCluster();

    // Act
    const result = await entryService.create({ clusterId: cluster.id });

    // Assert
    expect(result).toEqual({
      success: true,
      value: {
        entry: {
          id: expect.any(String),
          clusterId: cluster.id,
          createdAt: expect.any(Date),
        },
        version: {
          id: expect.any(String),
          entryId: expect.any(String),
          version: 1,
          createdAt: expect.any(Date),
        },
      },
    });
  });

  it("should increment version number on update", async () => {
    // Arrange
    const { entry } = await createTestEntry();

    // Act
    const result = await entryService.update({ id: entry.id });

    // Assert
    expect(result).toEqual({
      success: true,
      value: {
        id: expect.any(String),
        entryId: entry.id,
        version: 2,
        createdAt: expect.any(Date),
      },
    });
  });

  it("should return NotFoundError when updating nonexistent entry", async () => {
    // Act
    const result = await entryService.update({ id: crypto.randomUUID() });

    // Assert
    expect(result).toEqual({
      success: false,
      error: expect.any(NotFoundError),
    });
  });

  it("should return latest version when no version specified in get", async () => {
    // Arrange
    const { entry } = await createTestEntry();
    await entryService.update({ id: entry.id });
    await entryService.update({ id: entry.id });

    // Act
    const result = await entryService.get({ id: entry.id });
    if (!result.success) throw new Error("Get failed");

    // Assert
    expect(result.value.version.version).toBe(3);
    expect(result.value.entry.id).toBe(entry.id);
  });

  it("should return specific version when version number provided in get", async () => {
    // Arrange
    const { entry } = await createTestEntry();
    await entryService.update({ id: entry.id });

    // Act
    const result = await entryService.get({ id: entry.id, version: 1 });
    if (!result.success) throw new Error("Get failed");

    // Assert
    expect(result.value.version.version).toBe(1);
    expect(result.value.entry.id).toBe(entry.id);
  });

  it("should return NotFoundError when getting nonexistent entry", async () => {
    // Act
    const result = await entryService.get({ id: crypto.randomUUID() });

    // Assert
    expect(result).toEqual({
      success: false,
      error: expect.any(NotFoundError),
    });
  });

  it("should return NotFoundError when getting nonexistent version", async () => {
    // Arrange
    const { entry } = await createTestEntry();

    // Act
    const result = await entryService.get({ id: entry.id, version: 99 });

    // Assert
    expect(result).toEqual({
      success: false,
      error: expect.any(NotFoundError),
    });
  });

  it("should include entry from requested cluster in list", async () => {
    // Arrange
    const { cluster, entry } = await createTestEntry();

    // Act
    const result = await entryService.list({ clusterIds: [cluster.id] });
    if (!result.success) throw new Error("List failed");

    // Assert
    expect(result.value).toContainEqual(entry);
  });

  it("should exclude entries from unrequested clusters", async () => {
    // Arrange
    const requested = await createTestEntry();
    const other = await createTestEntry();

    // Act
    const result = await entryService.list({
      clusterIds: [requested.cluster.id],
    });
    if (!result.success) throw new Error("List failed");

    // Assert
    expect(result.value.some((e) => e.id === other.entry.id)).toBe(false);
  });

  it("should return empty array for empty clusterIds without DB call", async () => {
    // Act
    const result = await entryService.list({ clusterIds: [] });

    // Assert
    expect(result).toEqual({ success: true, value: [] });
  });

  it("should pair entries with their latest versions in listWithLatestVersion", async () => {
    // Arrange
    const { cluster, entry } = await createTestEntry();
    await entryService.update({ id: entry.id });
    await entryService.update({ id: entry.id });

    // Act
    const result = await entryService.listWithLatestVersion({
      clusterIds: [cluster.id],
    });
    if (!result.success) throw new Error("listWithLatestVersion failed");

    // Assert
    expect(result.value).toContainEqual({
      entry,
      version: expect.objectContaining({
        entryId: entry.id,
        version: 3,
      }),
    });
  });
});
