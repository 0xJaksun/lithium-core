import { describe, it, expect } from "vitest";
import { NotFoundError } from "@lithium-ai/core";
import { PostgresClusterAdapter } from "./cluster.port";
import { createClusterService } from "@lithium-ai/core";
import { setupTestDb } from "../test/setup";

describe("Cluster Integration", async () => {
  const clusterService = createClusterService(
    new PostgresClusterAdapter(await setupTestDb())
  );

  it("should create a root cluster with correct shape", async () => {
    // Arrange
    const name = crypto.randomUUID();

    // Act
    const result = await clusterService.create({ name });

    // Assert
    expect(result).toEqual({
      success: true,
      value: {
        id: expect.any(String),
        parentId: null,
        path: name,
        name,
        description: null,
        createdAt: expect.any(Date),
      },
    });
  });

  it("should retrieve a created cluster by path", async () => {
    // Arrange
    const name = crypto.randomUUID();
    const created = await clusterService.create({ name });

    // Act
    const found = await clusterService.findByPath({ path: name });

    // Assert
    expect(found).toEqual(created);
  });

  it("should build child path as parentPath.name", async () => {
    // Arrange
    const parentName = crypto.randomUUID();
    const childName = crypto.randomUUID();
    await clusterService.create({ name: parentName });

    // Act
    const child = await clusterService.create({
      name: childName,
      parentPath: parentName,
    });

    // Assert
    expect(child).toEqual({
      success: true,
      value: expect.objectContaining({
        path: `${parentName}.${childName}`,
        name: childName,
      }),
    });
  });

  it("should set parentId to the parent cluster ID", async () => {
    // Arrange
    const parentName = crypto.randomUUID();
    const parent = await clusterService.create({ name: parentName });
    if (!parent.success) throw new Error("Parent creation failed");

    // Act
    const child = await clusterService.create({
      name: crypto.randomUUID(),
      parentPath: parentName,
    });

    // Assert
    expect(child).toEqual({
      success: true,
      value: expect.objectContaining({
        parentId: parent.value.id,
      }),
    });
  });

  it("should include created cluster in list results with correct shape", async () => {
    // Arrange
    const name = crypto.randomUUID();
    const created = await clusterService.create({ name });
    if (!created.success) throw new Error("Create failed");

    // Act
    const result = await clusterService.list();
    if (!result.success) throw new Error("List failed");

    // Assert
    expect(result.value).toContainEqual(created.value);
  });

  it("should return exact descendant IDs for parent and child", async () => {
    // Arrange
    const parentName = crypto.randomUUID();
    const childName = crypto.randomUUID();
    const parent = await clusterService.create({ name: parentName });
    if (!parent.success) throw new Error("Parent creation failed");
    const child = await clusterService.create({
      name: childName,
      parentPath: parentName,
    });
    if (!child.success) throw new Error("Child creation failed");

    // Act
    const result = await clusterService.listDescendantIds({ path: parentName });

    // Assert
    expect(result).toEqual({
      success: true,
      value: expect.arrayContaining([parent.value.id, child.value.id]),
    });
  });

  it("should not include unrelated clusters in descendant IDs", async () => {
    // Arrange
    const parentName = crypto.randomUUID();
    const unrelatedName = crypto.randomUUID();
    const parent = await clusterService.create({ name: parentName });
    if (!parent.success) throw new Error("Parent creation failed");
    const unrelated = await clusterService.create({ name: unrelatedName });
    if (!unrelated.success) throw new Error("Unrelated creation failed");

    // Act
    const result = await clusterService.listDescendantIds({ path: parentName });
    if (!result.success) throw new Error("listDescendantIds failed");

    // Assert
    expect(result.value).toContain(parent.value.id);
    expect(result.value).not.toContain(unrelated.value.id);
  });

  it("should return NotFoundError for missing parent path", async () => {
    // Act
    const result = await clusterService.create({
      name: crypto.randomUUID(),
      parentPath: "nonexistent",
    });

    // Assert
    expect(result).toEqual({
      success: false,
      error: expect.any(NotFoundError),
    });
  });
});
