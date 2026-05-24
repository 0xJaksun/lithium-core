import { describe, it, expect } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { EntryStoragePort } from "./entry.port";
import type { Entry, EntryVersion } from "./entry.types";
import { createEntryService } from ".";
import { NotFoundError, SystemError } from "../../errors";

describe("EntryService", () => {
  describe("create", () => {
    it("should insert an entry and version 1 for the given clusterId", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const version: EntryVersion = {
        id: crypto.randomUUID(),
        entryId: entry.id,
        version: 1,
        createdAt: new Date(),
      };
      port.insert.mockResolvedValue({ success: true, value: entry });
      port.insertVersion.mockResolvedValue({ success: true, value: version });
      const service = createEntryService(port);

      // Act
      const result = await service.create({ clusterId: entry.clusterId });

      // Assert
      expect(result).toEqual({
        success: true,
        value: { entry, version },
      });
      expect(port.insert).toHaveBeenCalledWith({ clusterId: entry.clusterId });
      expect(port.insertVersion).toHaveBeenCalledWith({
        entryId: entry.id,
        version: 1,
      });
    });

    it("should not insert a version when entry insert fails", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      port.insert.mockResolvedValue({
        success: false,
        error: new SystemError("db down"),
      });
      const service = createEntryService(port);

      // Act
      const result = await service.create({ clusterId: crypto.randomUUID() });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(SystemError),
      });
      expect(port.insertVersion).not.toHaveBeenCalled();
    });

    it("should return error when version insert fails after entry insert", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      port.insert.mockResolvedValue({ success: true, value: entry });
      port.insertVersion.mockResolvedValue({
        success: false,
        error: new SystemError("version failed"),
      });
      const service = createEntryService(port);

      // Act
      const result = await service.create({ clusterId: entry.clusterId });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(SystemError),
      });
    });
  });

  describe("update", () => {
    it("should insert a new version with incremented version number", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entryId = crypto.randomUUID();
      const latestVersion: EntryVersion = {
        id: crypto.randomUUID(),
        entryId,
        version: 3,
        createdAt: new Date(),
      };
      const newVersion: EntryVersion = {
        id: crypto.randomUUID(),
        entryId,
        version: 4,
        createdAt: new Date(),
      };
      port.getLatestVersion.mockResolvedValue({
        success: true,
        value: latestVersion,
      });
      port.insertVersion.mockResolvedValue({
        success: true,
        value: newVersion,
      });
      const service = createEntryService(port);

      // Act
      const result = await service.update({ id: entryId });

      // Assert
      expect(result).toEqual({ success: true, value: newVersion });
      expect(port.insertVersion).toHaveBeenCalledWith({
        entryId,
        version: 4,
      });
    });

    it("should return NotFoundError when entry has no versions", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      port.getLatestVersion.mockResolvedValue({ success: true, value: null });
      const service = createEntryService(port);

      // Act
      const result = await service.update({ id: crypto.randomUUID() });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(NotFoundError),
      });
    });
  });

  describe("get", () => {
    it("should return entry with latest version when no version specified", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const version: EntryVersion = {
        id: crypto.randomUUID(),
        entryId: entry.id,
        version: 2,
        createdAt: new Date(),
      };
      port.findById.mockResolvedValue({ success: true, value: entry });
      port.getLatestVersion.mockResolvedValue({
        success: true,
        value: version,
      });
      const service = createEntryService(port);

      // Act
      const result = await service.get({ id: entry.id });

      // Assert
      expect(result).toEqual({
        success: true,
        value: { entry, version },
      });
    });

    it("should return entry with specific version when version number provided", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const version: EntryVersion = {
        id: crypto.randomUUID(),
        entryId: entry.id,
        version: 1,
        createdAt: new Date(),
      };
      port.findById.mockResolvedValue({ success: true, value: entry });
      port.getVersion.mockResolvedValue({ success: true, value: version });
      const service = createEntryService(port);

      // Act
      const result = await service.get({ id: entry.id, version: 1 });

      // Assert
      expect(result).toEqual({
        success: true,
        value: { entry, version },
      });
      expect(port.getVersion).toHaveBeenCalledWith(entry.id, 1);
    });

    it("should return NotFoundError when entry does not exist", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      port.findById.mockResolvedValue({ success: true, value: null });
      const service = createEntryService(port);

      // Act
      const result = await service.get({ id: crypto.randomUUID() });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(NotFoundError),
      });
    });

    it("should return NotFoundError when requested version does not exist", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      port.findById.mockResolvedValue({ success: true, value: entry });
      port.getVersion.mockResolvedValue({ success: true, value: null });
      const service = createEntryService(port);

      // Act
      const result = await service.get({ id: entry.id, version: 99 });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(NotFoundError),
      });
    });
  });

  describe("list", () => {
    it("should return entries for the given cluster IDs", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({ success: true, value: [entry] });
      const service = createEntryService(port);

      // Act
      const result = await service.list({ clusterIds: [entry.clusterId] });

      // Assert
      expect(result).toEqual({ success: true, value: [entry] });
    });

    it("should return empty array without calling port when clusterIds is empty", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const service = createEntryService(port);

      // Act
      const result = await service.list({ clusterIds: [] });

      // Assert
      expect(result).toEqual({ success: true, value: [] });
      expect(port.list).not.toHaveBeenCalled();
    });
  });

  describe("listWithLatestVersion", () => {
    it("should return entries paired with their latest versions", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const version: EntryVersion = {
        id: crypto.randomUUID(),
        entryId: entry.id,
        version: 3,
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({ success: true, value: [entry] });
      port.getLatestVersions.mockResolvedValue({
        success: true,
        value: [version],
      });
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({
        clusterIds: [entry.clusterId],
      });

      // Assert
      expect(result).toEqual({
        success: true,
        value: [{ entry, version }],
      });
    });

    it("should return empty array without calling port when clusterIds is empty", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({ clusterIds: [] });

      // Assert
      expect(result).toEqual({ success: true, value: [] });
      expect(port.list).not.toHaveBeenCalled();
    });

    it("should filter out entries that have no matching version", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entryWithVersion: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const orphanEntry: Entry = {
        id: crypto.randomUUID(),
        clusterId: entryWithVersion.clusterId,
        createdAt: new Date(),
      };
      const version: EntryVersion = {
        id: crypto.randomUUID(),
        entryId: entryWithVersion.id,
        version: 1,
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({
        success: true,
        value: [entryWithVersion, orphanEntry],
      });
      port.getLatestVersions.mockResolvedValue({
        success: true,
        value: [version],
      });
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({
        clusterIds: [entryWithVersion.clusterId],
      });

      // Assert
      expect(result).toEqual({
        success: true,
        value: [{ entry: entryWithVersion, version }],
      });
    });

    it("should return empty array when port returns no entries for the clusterIds", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      port.list.mockResolvedValue({ success: true, value: [] });
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({
        clusterIds: [crypto.randomUUID()],
      });

      // Assert
      expect(result).toEqual({ success: true, value: [] });
      expect(port.getLatestVersions).not.toHaveBeenCalled();
    });

    it("should propagate error when getLatestVersions fails", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({ success: true, value: [entry] });
      port.getLatestVersions.mockResolvedValue({
        success: false,
        error: new SystemError("db down"),
      });
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({
        clusterIds: [entry.clusterId],
      });

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.any(SystemError),
      });
    });

    it("should return empty array when entries exist but none have versions", async () => {
      // Arrange
      const port = mockDeep<EntryStoragePort>();
      const entry: Entry = {
        id: crypto.randomUUID(),
        clusterId: crypto.randomUUID(),
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({ success: true, value: [entry] });
      port.getLatestVersions.mockResolvedValue({ success: true, value: [] });
      const service = createEntryService(port);

      // Act
      const result = await service.listWithLatestVersion({
        clusterIds: [entry.clusterId],
      });

      // Assert
      expect(result).toEqual({ success: true, value: [] });
    });
  });
});
