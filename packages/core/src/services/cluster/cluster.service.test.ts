import { describe, it, expect } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { ClusterStoragePort } from "./cluster.port";
import type { Cluster } from "./cluster.types";
import { createClusterService } from ".";

describe("ClusterService", () => {
  describe("create", () => {
    it("should insert a cluster with path equal to name when no parentPath is provided", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      const cluster: Cluster = {
        id: crypto.randomUUID(),
        parentId: null,
        path: "infra",
        name: "infra",
        description: null,
        createdAt: new Date(),
      };
      port.insert.mockResolvedValue({ success: true, value: cluster });
      const service = createClusterService(port);

      // Act
      const result = await service.create({ name: "infra" });

      // Assert
      expect(result).toEqual({ success: true, value: cluster });
      expect(port.insert).toHaveBeenCalledWith({
        parentId: null,
        path: "infra",
        name: "infra",
        description: null,
      });
    });

    it("should pass description to the port when provided", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      const cluster: Cluster = {
        id: crypto.randomUUID(),
        parentId: null,
        path: "infra",
        name: "infra",
        description: "Infrastructure",
        createdAt: new Date(),
      };
      port.insert.mockResolvedValue({ success: true, value: cluster });
      const service = createClusterService(port);

      // Act
      await service.create({ name: "infra", description: "Infrastructure" });

      // Assert
      expect(port.insert).toHaveBeenCalledWith({
        parentId: null,
        path: "infra",
        name: "infra",
        description: "Infrastructure",
      });
    });

    it("should resolve parent by path and build child path as parentPath.name", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      const parent: Cluster = {
        id: crypto.randomUUID(),
        parentId: null,
        path: "infra",
        name: "infra",
        description: null,
        createdAt: new Date(),
      };
      const child: Cluster = {
        id: crypto.randomUUID(),
        parentId: parent.id,
        path: "infra.db",
        name: "db",
        description: null,
        createdAt: new Date(),
      };
      port.findByPath.mockResolvedValue({ success: true, value: parent });
      port.insert.mockResolvedValue({ success: true, value: child });
      const service = createClusterService(port);

      // Act
      const result = await service.create({ name: "db", parentPath: "infra" });

      // Assert
      expect(result).toEqual({ success: true, value: child });
      expect(port.insert).toHaveBeenCalledWith({
        parentId: parent.id,
        path: "infra.db",
        name: "db",
        description: null,
      });
    });

    it("should return NotFoundError when the provided parentPath does not exist", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      port.findByPath.mockResolvedValue({ success: true, value: null });
      const service = createClusterService(port);

      // Act
      const result = await service.create({ name: "db", parentPath: "nope" });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.kind).toBe("NotFoundError");
      }
    });

    it("should propagate the port error when findByPath fails", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      port.findByPath.mockResolvedValue({
        success: false,
        error: new Error("db down") as any,
      });
      const service = createClusterService(port);

      // Act
      const result = await service.create({ name: "db", parentPath: "infra" });

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("findByPath", () => {
    it("should return the cluster when a matching path exists", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      const cluster: Cluster = {
        id: crypto.randomUUID(),
        parentId: null,
        path: "infra",
        name: "infra",
        description: null,
        createdAt: new Date(),
      };
      port.findByPath.mockResolvedValue({ success: true, value: cluster });
      const service = createClusterService(port);

      // Act
      const result = await service.findByPath({ path: "infra" });

      // Assert
      expect(result).toEqual({ success: true, value: cluster });
    });

    it("should return null when no cluster matches the path", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      port.findByPath.mockResolvedValue({ success: true, value: null });
      const service = createClusterService(port);

      // Act
      const result = await service.findByPath({ path: "nope" });

      // Assert
      expect(result).toEqual({ success: true, value: null });
    });
  });

  describe("list", () => {
    it("should return all clusters from the port", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      const cluster: Cluster = {
        id: crypto.randomUUID(),
        parentId: null,
        path: "infra",
        name: "infra",
        description: null,
        createdAt: new Date(),
      };
      port.list.mockResolvedValue({ success: true, value: [cluster] });
      const service = createClusterService(port);

      // Act
      const result = await service.list();

      // Assert
      expect(result).toEqual({ success: true, value: [cluster] });
    });
  });

  describe("listDescendantIds", () => {
    it("should return all descendant cluster IDs for the given path", async () => {
      // Arrange
      const port = mockDeep<ClusterStoragePort>();
      port.listDescendantIds.mockResolvedValue({
        success: true,
        value: ["1", "2", "3"],
      });
      const service = createClusterService(port);

      // Act
      const result = await service.listDescendantIds({ path: "infra" });

      // Assert
      expect(result).toEqual({
        success: true,
        value: ["1", "2", "3"],
      });
    });
  });
});
